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

const PASSWORD_RESET_TOKEN_EXPIRATION_MS = 18000000; // 5 hours

const createPasswordResetUrl = (token: string, userId: number): string => {
    const encryptedUserId = encrypt(userId.toString());
    return `${process.env.APP_SERVER_URL}/change-password?token=${token}&u=${encryptedUserId}`;
};

export class AuthController {
    public static login = async (req: Request, res: Response) => {
        // Check if username and password are set
        const { username, password } = req.body;
        if (!(username && password)) {
            res.status(400).send({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
            return;
        }

        // Get user from database
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail({ where: { email: username } });
        } catch (error) {
            res.status(401).send({ success: false, error: 'LOGIN_USER_NOT_FOUND' });
            return;
        }

        // Check if encrypted password match
        if (!user.checkIfUnencryptedPasswordIsValid(password)) {
            res.status(401).send({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
            return;
        }

        // Sign JWT, valid for 2 hours
        const token = jwt.sign({ userId: user.id, email: user.email }, jwtConfig.secret, { expiresIn: '2h' });

        // Send the jwt in the response
        res.send({ success: true, jwt: token });
    };

    public static passwordRecoveryProcess = async (req: Request, res: Response) => {
        const { email } = req.body;
        if (!email) {
            res.status(400).send({ success: false, error: 'PASSWORD_RESET_MISSING_EMAIL' });
            return;
        }

        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail({ where: { email } });
        } catch (error) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
            return;
        }

        const passwordResetRepository = getRepository(PasswordReset);
        const limitDate = Date.now() - PASSWORD_RESET_TOKEN_EXPIRATION_MS;

        const result = await passwordResetRepository
            .createQueryBuilder('passwordReset')
            .select('passwordReset.id')
            .andWhere('userId = :userId')
            .andWhere('createdAt > :limitDate')
            .setParameters({ userId: user.id, limitDate: new Date(limitDate) })
            .getMany();

        if (result.length > 0) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_ONGOING_RECOVERY_PROCESS' });
            return;
        }

        const token = uuidv4();
        const passwordReset = new PasswordReset();
        passwordReset.token = token;
        passwordReset.user = user;

        user.passwordResets = user.passwordResets ? [...user.passwordResets, passwordReset] : [passwordReset];
        await userRepository.save(user);

        res.status(200).send({ success: true });

        const emailOptions: EmailOptions = {
            destinationEmail: user.email,
            template: 'password-reset',
            localValues: {
                name: user.firstName,
                url: createPasswordResetUrl(token, user.id)
            }
        };

        sendEmail(emailOptions);
    };

    public static resetPassword = async (req: Request, res: Response) => {
        const { newPassword, token, userId: encryptedUserId } = req.body;
        if (!(newPassword && token && encryptedUserId)) {
            res.status(400).send({ success: false, error: 'RESET_MISSING_DATA' });
            return;
        }

        // Check if password satisfies the complexity rules
        if (!checkPasswordComplexity(newPassword)) {
            res.status(401).send({ success: false, error: 'REGISTER_PASSWORD_COMPLEXITY' });
            return;
        }

        // Search in DB for the entity with token
        const passwordResetRepository = getRepository(PasswordReset);
        let passwordReset: PasswordReset;
        try {
            passwordReset = await passwordResetRepository.findOneOrFail({ where: { token }, relations: ['user'] });
        } catch (error) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
            return;
        }

        // Check if token is expired
        if (passwordReset.createdAt.getTime() + PASSWORD_RESET_TOKEN_EXPIRATION_MS < Date.now()) {
            res.status(401).send({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });
            return;
        }

        // Check if decrypted userId matches with user.id from database
        let decryptedUserId: string;
        try {
            decryptedUserId = decrypt(encryptedUserId);
        } catch (error) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
            return;
        }

        if (parseInt(decryptedUserId, 10) !== passwordReset.user.id) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
            return;
        }

        // Fetch user, change password
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail({ where: { id: decryptedUserId } });
        } catch (error) {
            res.status(401).send({ success: false, error: 'USER_NOT_FOUND' });
            return;
        }

        // Set new password and check for errors
        user.password = newPassword;
        const errors = await validate(user);
        if (errors.length > 0) {
            res.status(500).send({ success: false, error: 'UNEXPECTED_ERROR' }); // FIXME user better message
            return;
        }

        // Hash the new password and save
        user.hashPassword();
        await userRepository.save(user);

        res.status(200).send({ success: true });

        // Send success email: password changed
        const emailOptions: EmailOptions = {
            destinationEmail: user.email,
            template: 'password-reset-success',
            localValues: {
                name: user.firstName,
                url: `${process.env.APP_SERVER_URL}/password-reset`
            }
        };

        sendEmail(emailOptions);
    };

    public static checkPasswordToken = async (req: Request, res: Response) => {
        const { token, userId: encryptedUserId } = req.params;
        if (!token) {
            res.status(400).send({ success: false, error: 'PASSWORD_TOKEN_REQUIRED' });
            return;
        }

        if (!encryptedUserId) {
            res.status(400).send({ success: false, error: 'PASSWORD_USER_ID_REQUIRED' });
            return;
        }

        const passwordResetRepository = getRepository(PasswordReset);
        let passwordReset: PasswordReset;
        try {
            passwordReset = await passwordResetRepository.findOneOrFail({ where: { token }, relations: ['user'] });
        } catch (error) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_USER_NOT_FOUND' });
            return;
        }

        // security check TODO improve message
        let decryptedUserId: string;
        try {
            decryptedUserId = decrypt(encryptedUserId);
        } catch (error) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
            return;
        }

        if (parseInt(decryptedUserId, 10) !== passwordReset.user.id) {
            res.status(401).send({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
            return;
        }

        if (passwordReset.createdAt.getTime() + PASSWORD_RESET_TOKEN_EXPIRATION_MS < Date.now()) {
            res.status(401).send({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });
            return;
        }

        res.status(200).send({ success: true });
    };

    public static changePassword = async (req: Request, res: Response) => {
        // Get ID from JWT
        const id = res.locals.jwtPayload.userId;

        // Get parameters from the body
        const { currentPassword, newPassword } = req.body;
        if (!(currentPassword && newPassword)) {
            res.status(400).send({ success: false, error: 'CHANGE_PASSWORD_MISSING_PASSWORDS' });
            return;
        }

        // Get user from the database
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail(id);
        } catch (id) {
            res.status(401).send({ success: false, error: 'CHANGE_PASSWORD_USER_NOT_FOUND' });
            return;
        }

        // Check if old password matchs
        if (!user.checkIfUnencryptedPasswordIsValid(currentPassword)) {
            res.status(401).send({ success: false, error: 'CHANGE_PASSWORD_INCORRECT_CURRENT_PASSWORD' });
            return;
        }

        // Validate de model (password lenght)
        user.password = newPassword;
        const errors = await validate(user);
        if (errors.length > 0) {
            res.status(400).send({ success: false, error: 'CHANGE_PASSWORD_PASSWORD_COMPLEXITY' });
            return;
        }

        // Hash the new password and save
        user.hashPassword();
        const updatedUser = await userRepository.save(user);
        delete updatedUser.password;

        res.status(200).send({ success: true, user: updatedUser });
    };
}
