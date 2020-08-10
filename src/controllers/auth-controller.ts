import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';
import * as uuidv4 from 'uuid/v4';
import { User } from '../entity/User';
import { jwtConfig } from '../config/config';
import { PasswordReset } from '../entity/PasswordReset';
import { sendEmail, EmailOptions } from '../utils/email-sender';
import { encrypt, decrypt } from '../utils/encrypter';
import { checkPasswordComplexity } from '../utils/validators';
import { UserRole } from '../entity/model';
import { UserDAO } from '../dao/user-dao';
import { NotFoundError } from '../errors/not-found-error';
import { PasswordResetDAO } from '../dao/password-reset-dao';
import { DecryptError } from '../errors/decrypt-error';

export class AuthController {
    private userDAO: UserDAO;
    private passwordResetDAO: PasswordResetDAO;
    private static PASSWORD_RESET_TOKEN_EXPIRATION_MS = 18000000; // 5 hours

    constructor() {
        this.userDAO = new UserDAO();
        this.passwordResetDAO = new PasswordResetDAO();
    }

    private static createPasswordResetUrl(token: string, userId: number): string {
        const encryptedUserId = encrypt(userId.toString());
        return `${process.env.APP_SERVER_URL}/change-password?token=${token}&u=${encryptedUserId}`;
    };

    public login = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            if (!(username && password)) {
                return res.status(400).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
            }

            const user = await this.userDAO.findByEmailOrFail(username);

            if (!user.checkIfUnencryptedPasswordIsValid(password)) {
                return res.status(401).send({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
            }
    
            const token = jwt.sign({ userId: user.id, email: user.email }, jwtConfig.secret, { expiresIn: '2h' });
    
            return res.send({ success: true, jwt: token });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'LOGIN_USER_NOT_FOUND' });
            } else {
                return res.status(500).send({ success: false, error: 'LOGIN_ADMIN_FAILED' });
            }
        }
    }

    public loginAdmin = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            if (!(username && password)) {
                return res.status(400).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
            }
    
            const user = await this.userDAO.findByEmailOrFail(username);

            if (!user.checkIfUnencryptedPasswordIsValid(password)) {
                return res.status(401).send({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
            }
    
            if (user.role !== UserRole.ADMIN) {
                return res.status(403).send({ success: false, error: 'USER_NOT_AUTHORIZED' });
            }
    
            const token = jwt.sign({ userId: user.id, email: user.email }, jwtConfig.secret, { expiresIn: '2h' });
    
            return res.send({ success: true, jwt: token });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'LOGIN_ADMIN_USER_NOT_FOUND' });
            } else {
                console.log(error);
                return res.status(500).send({ success: false, error: 'LOGIN_ADMIN_FAILED' });
            }
        }
    }

    private sendPasswordRecoveryEmail(user: User, token: string) {
        const emailOptions: EmailOptions = {
            destinationEmail: user.email,
            template: 'password-reset',
            localValues: {
                name: user.firstName,
                url: AuthController.createPasswordResetUrl(token, user.id)
            }
        };

        sendEmail(emailOptions);
    }

    public passwordRecoveryProcess = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).send({ success: false, error: 'PASSWORD_RESET_MISSING_EMAIL' });
            }

            const user = await this.userDAO.findByEmailOrFail(email);

            const limitDate = Date.now() - AuthController.PASSWORD_RESET_TOKEN_EXPIRATION_MS;
            const result = await this.passwordResetDAO.findActivePasswordRecoveriesFromUser(user.id, limitDate);
    
            if (result.length > 0) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_ONGOING_RECOVERY_PROCESS' });
            }

            const token = uuidv4();
            const passwordReset = new PasswordReset();
            passwordReset.token = token;
            passwordReset.user = user;
    
            user.passwordResets = user.passwordResets ? [...user.passwordResets, passwordReset] : [passwordReset];
            await this.userDAO.save(user);
    
            return res.status(200).send({ success: true });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
            } else {
                return res.status(500).send({ success: false, error: 'PASSWORD_RESET_FAILED' });
            }
        }
    };

    public resetPassword = async (req: Request, res: Response) => {
        try {
            const { newPassword, token, userId: encryptedUserId } = req.body;
            if (!(newPassword && token && encryptedUserId)) {
                return res.status(400).send({ success: false, error: 'RESET_MISSING_DATA' });
            }
    
            if (!checkPasswordComplexity(newPassword)) {
                return res.status(401).send({ success: false, error: 'REGISTER_PASSWORD_COMPLEXITY' });
            }

            const passwordReset = await this.passwordResetDAO.findByTokenOrFail(token);

            if (passwordReset.createdAt.getTime() + AuthController.PASSWORD_RESET_TOKEN_EXPIRATION_MS < Date.now()) {
                return res.status(401).send({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });
            }

            const decryptedUserId = decrypt(encryptedUserId);

            if (parseInt(decryptedUserId, 10) !== passwordReset.user.id) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
            }

            const userRepository = getRepository(User);
            let user: User;
            try {
                user = await this.userDAO.findByIdOrFail(decryptedUserId);
            } catch (error) {
                return res.status(401).send({ success: false, error: 'USER_NOT_FOUND' });
            }

            user.password = newPassword;
            const errors = await validate(user);
            if (errors.length > 0) {
                return res.status(500).send({ success: false, error: 'UNEXPECTED_ERROR' }); // FIXME user better message
            }

            user.hashPassword();
            await userRepository.save(user);

            res.status(200).send({ success: true });

            this.sendPasswordRecoveryEmail(user, token);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
            } else if (error instanceof DecryptError) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
            } else {
                return res.status(500).send({ success: false, error: 'PASSWORD_RESET_FAILED' });
            }
        }
    };

    public checkPasswordToken = async (req: Request, res: Response) => {
        try {
            const { token, userId: encryptedUserId } = req.params;
            if (!token) {
                return res.status(400).send({ success: false, error: 'PASSWORD_TOKEN_REQUIRED' });
            }
    
            if (!encryptedUserId) {
                return res.status(400).send({ success: false, error: 'PASSWORD_USER_ID_REQUIRED' });
            }

            const passwordReset = await this.passwordResetDAO.findByTokenOrFail(token);

            const decryptedUserId = decrypt(encryptedUserId);
    
            if (parseInt(decryptedUserId, 10) !== passwordReset.user.id) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
            }
    
            if (passwordReset.createdAt.getTime() + AuthController.PASSWORD_RESET_TOKEN_EXPIRATION_MS < Date.now()) {
                return res.status(401).send({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });
            }

            return res.status(200).send({ success: true });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PASSWORD_RESET_TOKEN_USER_NOT_FOUND' });
            } else if (error instanceof DecryptError) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
            } else {
                return res.status(500).send({ success: false, error: 'CHECK_PASSWORD_TOKEN_FAILED' });
            }
        }
    };

    public changePassword = async (req: Request, res: Response) => {
        try {
            const id = res.locals.jwtPayload.userId;
    
            const { currentPassword, newPassword } = req.body;
            if (!(currentPassword && newPassword)) {
                return res.status(400).send({ success: false, error: 'CHANGE_PASSWORD_MISSING_PASSWORDS' });
            }
    
            const user = await this.userDAO.findByIdOrFail(id);

            if (!user.checkIfUnencryptedPasswordIsValid(currentPassword)) {
                return res.status(401).send({ success: false, error: 'CHANGE_PASSWORD_INCORRECT_CURRENT_PASSWORD' });
            }
    
            user.password = newPassword;
            const errors = await validate(user);
            if (errors.length > 0) {
                return res.status(400).send({ success: false, error: 'CHANGE_PASSWORD_PASSWORD_COMPLEXITY' });
            }

            user.hashPassword();
            const updatedUser = await this.userDAO.save(user);
            
            delete updatedUser.password;

            return res.status(200).send({ success: true, user: updatedUser });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CHANGE_PASSWORD_USER_NOT_FOUND' });
            } else {
                return res.status(500).send({ success: false, error: 'CHANGE_PASSWORD_FAILED' });
            }
        }
    };
}
