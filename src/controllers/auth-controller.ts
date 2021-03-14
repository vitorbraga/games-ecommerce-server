import { Request, Response } from 'express';
import * as uuid from 'uuid';
import { User } from '../entities/User';
import { PasswordReset } from '../entities/PasswordReset';
import { sendEmail, EmailOptions } from '../utils/email-sender';
import * as EncryptionUtils from '../utils/encryption-utils';
import { validatePasswordComplexity } from '../utils/validators';
import { UserRole } from '../entities/model';
import { UserDAO } from '../dao/user-dao';
import { NotFoundError } from '../errors/not-found-error';
import { PasswordResetDAO } from '../dao/password-reset-dao';
import { DecryptError } from '../errors/decrypt-error';
import { buildUserSession } from '../utils/data-filters';
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
                return res.status(422).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
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
                return res.status(500).send({ success: false, error: 'LOGIN_FAILED' });
            }
        }
    };

    public loginAdmin = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;
            if (!(username && password)) {
                return res.status(422).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
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
        const encryptedUserId = EncryptionUtils.encrypt(user.id.toString());
        const url = `${process.env.APP_SERVER_URL}/reset-password?token=${token}&u=${encryptedUserId}`;

        const emailOptions: EmailOptions = {
            destinationEmail: user.email,
            template: 'password-reset',
            localValues: {
                name: user.firstName,
                url
            }
        };

        sendEmail(emailOptions);
    }

    public passwordRecoveryProcess = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(422).send({ success: false, error: 'PASSWORD_RESET_MISSING_EMAIL' });
            }

            const user = await this.userDAO.findByEmailOrFail(email);

            const limitDate = Date.now() - AuthController.PASSWORD_RESET_TOKEN_EXPIRATION_MS;
            const result = await this.passwordResetDAO.findActivePasswordRecoveriesFromUser(user.id, limitDate);

            if (result.length > 0) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_ONGOING_RECOVERY_PROCESS' });
            }

            const token = uuid.v4();
            const passwordReset = new PasswordReset();
            passwordReset.token = token;
            passwordReset.user = user;

            user.passwordResets = user.passwordResets ? [...user.passwordResets, passwordReset] : [passwordReset];
            const updatedUser = await this.userDAO.save(user);

            res.status(200).send({ success: true });

            this.sendPasswordRecoveryEmail(updatedUser, token);
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
                return res.status(422).send({ success: false, error: 'PASSWORD_RESET_MISSING_DATA' });
            }

            if (!validatePasswordComplexity(newPassword)) {
                return res.status(422).send({ success: false, error: 'PASSWORD_RESET_COMPLEXITY' });
            }

            const passwordReset = await this.passwordResetDAO.findByTokenOrFail(token);

            if (passwordReset.createdAt.getTime() + AuthController.PASSWORD_RESET_TOKEN_EXPIRATION_MS < Date.now()) {
                return res.status(401).send({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });
            }

            const decryptedUserId = EncryptionUtils.decrypt(encryptedUserId);

            if (decryptedUserId !== passwordReset.user!.id) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
            }

            let user: User;
            try {
                user = await this.userDAO.findByIdOrFail(decryptedUserId);
            } catch (error) {
                return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
            }

            user.password = newPassword;
            await user.hashPassword();
            await this.userDAO.save(user);

            return res.status(200).send({ success: true });

            // TODO Send email password reset success
            // this.sendPasswordRecoveryEmail(user, token);
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

    public checkPasswordTokenValid = async (req: Request, res: Response) => {
        try {
            const token = req.query.token as string;
            const encryptedUserId = req.query.userId as string;

            if (!token) {
                return res.status(422).send({ success: false, error: 'PASSWORD_TOKEN_REQUIRED' });
            }

            if (!encryptedUserId) {
                return res.status(422).send({ success: false, error: 'PASSWORD_USER_ID_REQUIRED' });
            }

            const passwordReset = await this.passwordResetDAO.findByTokenOrFail(token);

            const decryptedUserId = EncryptionUtils.decrypt(encryptedUserId);

            if (decryptedUserId !== passwordReset.user!.id) {
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
            }

            if (passwordReset.createdAt.getTime() + AuthController.PASSWORD_RESET_TOKEN_EXPIRATION_MS < Date.now()) {
                return res.status(401).send({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });
            }

            return res.status(200).send({ success: true });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PASSWORD_RESET_TOKEN_NOT_FOUND' });
            } else if (error instanceof DecryptError) {
                logger.error(error.stack);
                return res.status(401).send({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'CHECK_PASSWORD_TOKEN_FAILED' });
            }
        }
    };
}
