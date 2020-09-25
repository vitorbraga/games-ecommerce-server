import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';
import * as uuidv4 from 'uuid/v4';
import { User } from '../entity/User';
import { PasswordReset } from '../entity/PasswordReset';
import { sendEmail, EmailOptions } from '../utils/email-sender';
import { encrypt, decrypt } from '../utils/encrypter';
import { checkPasswordComplexity } from '../utils/validators';
import { UserRole } from '../entity/model';
import { UserDAO } from '../dao/user-dao';
import { NotFoundError } from '../errors/not-found-error';
import { PasswordResetDAO } from '../dao/password-reset-dao';
import { DecryptError } from '../errors/decrypt-error';
import { buildUserOutput, buildUserSession } from '../utils/data-filters';
import logger from '../utils/logger';
import * as AuthUtils from '../utils/auth-utils';

export class AuthController {
    private static PASSWORD_RESET_TOKEN_EXPIRATION_MS = 18000000; // 5 hours
    private userDAO: UserDAO;
    private passwordResetDAO: PasswordResetDAO;

    constructor() {
        this.userDAO = new UserDAO();
        this.passwordResetDAO = new PasswordResetDAO();
    }

    public login = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            if (!(username && password)) {
                return res.status(400).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
            }

            const user = await this.userDAO.findByEmailOrFail(username);

            if (!await user.checkIfUnencryptedPasswordIsValid(password)) {
                return res.status(401).send({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
            }

            const token = AuthUtils.createSignedToken(buildUserSession(user));

            return res.send({ success: true, jwt: token });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'LOGIN_USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'LOGIN_ADMIN_FAILED' });
            }
        }
    };

    public loginAdmin = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            if (!(username && password)) {
                return res.status(400).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
            }

            const user = await this.userDAO.findByEmailOrFail(username);

            if (!await user.checkIfUnencryptedPasswordIsValid(password)) {
                return res.status(401).send({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
            }

            if (user.role !== UserRole.ADMIN) {
                return res.status(403).send({ success: false, error: 'USER_NOT_AUTHORIZED' });
            }

            const token = AuthUtils.createSignedToken(buildUserSession(user));

            return res.send({ success: true, jwt: token });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'LOGIN_ADMIN_USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'LOGIN_ADMIN_FAILED' });
            }
        }
    };

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
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'PASSWORD_RESET_FAILED' });
            }
        }
    };

    // Reset password when user does not remember it
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

            if (decryptedUserId !== passwordReset.user.id) {
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

            await user.hashPassword();
            await userRepository.save(user);

            res.status(200).send({ success: true });

            this.sendPasswordRecoveryEmail(user, token);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
            } else if (error instanceof DecryptError) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
            } else {
                logger.error(error.stack);
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

            if (decryptedUserId !== passwordReset.user.id) {
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
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'CHECK_PASSWORD_TOKEN_FAILED' });
            }
        }
    };

    // Change password inside account area
    public changePassword = async (req: Request, res: Response) => {
        try {
            const id = res.locals.jwtPayload.userSession.id;

            const { currentPassword, newPassword } = req.body;
            if (!(currentPassword && newPassword)) {
                return res.status(400).send({ success: false, error: 'CHANGE_PASSWORD_MISSING_PASSWORDS' });
            }

            const user = await this.userDAO.findByIdOrFail(id);

            if (!await user.checkIfUnencryptedPasswordIsValid(currentPassword)) {
                return res.status(401).send({ success: false, error: 'CHANGE_PASSWORD_INCORRECT_CURRENT_PASSWORD' });
            }

            user.password = newPassword;
            const errors = await validate(user);
            if (errors.length > 0) {
                // TODO check this
                return res.status(400).send({ success: false, error: 'CHANGE_PASSWORD_PASSWORD_COMPLEXITY' });
            }

            await user.hashPassword();
            const updatedUser = await this.userDAO.save(user);

            return res.status(200).send({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CHANGE_PASSWORD_USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'CHANGE_PASSWORD_FAILED' });
            }
        }
    };

    private static createPasswordResetUrl(token: string, userId: string): string {
        const encryptedUserId = encrypt(userId.toString());
        return `${process.env.APP_SERVER_URL}/change-password?token=${token}&u=${encryptedUserId}`;
    };
}
