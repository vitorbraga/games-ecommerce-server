import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import * as uuid from 'uuid';
import * as Mocks from './mocks';
import logger from '../../../src/utils/logger';
import { UserDAO } from '../../../src/dao/user-dao';
import * as app from '../../../src/app';
import { User } from '../../../src/entity/User';
import * as AuthUtils from '../../../src/utils/auth-utils';
import * as Validators from '../../../src/utils/validators';
import * as EncryptionUtils from '../../../src/utils/encryption-utils';
import { PasswordResetDAO } from '../../../src/dao/password-reset-dao';
import { NotFoundError } from '../../../src/errors/not-found-error';
import { AuthController } from '../../../src/controllers/auth-controller';
import { DecryptError } from '../../../src/errors/decrypt-error';

describe('Auth API', function () {
    let server: http.Server;

    this.beforeAll(async () => {
        // TODO Use a sqlite database for test, configure, etc
        sinon.stub(logger, 'info').returns();

        server = await app.start();
    });

    this.beforeEach(() => {
        sinon.stub(logger, 'error').returns();
    });

    this.afterEach(() => {
        sinon.restore();
    });

    this.afterAll(async () => {
        await server.close();
        app.shutdown();
    });

    describe('POST /login', () => {
        const route = '/auth/login';

        it('Should login successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            sinon.stub(AuthUtils, 'createSignedToken').returns(Mocks.validJwtToken);

            const response = await request(server)
                .post(route)
                .send({
                    username: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, jwt: Mocks.validJwtToken });
        });

        it('Should not login due to lack of username', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    password: 'password123'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
        });

        it('Should not login due to lack of password', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    username: 'vitor@email.com'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
        });

        it('Should not login because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').throws(new NotFoundError('User not found.'));

            const response = await request(server)
                .post(route)
                .send({
                    username: 'notregistered@email.com',
                    password: 'password123'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_USER_NOT_FOUND' });
        });

        it('Should  not login because some unexpected error occurred', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            sinon.stub(AuthUtils, 'createSignedToken').throws(new Error('Unexpected error'));

            const response = await request(server)
                .post(route)
                .send({
                    username: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_FAILED' });
        });

        it('Should not login because credentials do not match', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(false);

            const response = await request(server)
                .post(route)
                .send({
                    username: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
        });
    });

    describe('POST /admin/login', () => {
        const route = '/auth/admin/login';

        it('Should login admin successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getAdminUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            sinon.stub(AuthUtils, 'createSignedToken').returns(Mocks.validJwtToken);

            const response = await request(server)
                .post(route)
                .send({
                    username: 'admin@email.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, jwt: Mocks.validJwtToken });
        });

        it('Should not login due to lack of username', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    password: 'password123'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
        });

        it('Should not login due to lack of password', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    username: 'admin@email.com'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_MISSING_CREDENTIALS' });
        });

        it('Should not login because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').throws(new NotFoundError('User not found.'));

            const response = await request(server)
                .post(route)
                .send({
                    username: 'notregistered@email.com',
                    password: 'password123'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_ADMIN_USER_NOT_FOUND' });
        });

        it('Should  not login because some unexpected error occurred', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getAdminUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            sinon.stub(AuthUtils, 'createSignedToken').throws(new Error('Unexpected error'));

            const response = await request(server)
                .post(route)
                .send({
                    username: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_ADMIN_FAILED' });
        });

        it('Should not login because credentials do not match', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getAdminUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(false);

            const response = await request(server)
                .post(route)
                .send({
                    username: 'admin@email.com',
                    password: 'password1234'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'LOGIN_UNMATCHED_EMAIL_PWD' });
        });

        it('Should not login because user does not have admin role', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);

            const response = await request(server)
                .post(route)
                .send({
                    username: 'user@email.com',
                    password: 'password123'
                })
                .expect(403);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_AUTHORIZED' });
        });
    });

    describe('POST /password-recovery', () => {
        const route = '/auth/password-recovery';

        it('Should create password recovery process successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(PasswordResetDAO.prototype, 'findActivePasswordRecoveriesFromUser').resolves([]);
            sinon.stub(uuid, 'v4').returns(Mocks.passwordRecoveryToken);
            sinon.stub(UserDAO.prototype, 'save').resolves(Mocks.getRegularUser());
            sinon.stub(AuthController.prototype, 'sendPasswordRecoveryEmail' as any).returns({});

            const response = await request(server)
                .post(route)
                .send({
                    email: 'vitor@email.com'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true });
        });

        it('Should not create password recovery due to lack of email parameter', async () => {
            const response = await request(server)
                .post(route)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_MISSING_EMAIL' });
        });

        it('Should not create password recovery because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').throws(new NotFoundError('User not found'));

            const response = await request(server)
                .post(route)
                .send({
                    email: 'nonexistentuser@email.com'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
        });

        it('Should not create password recovery process because there is already a process going on', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(PasswordResetDAO.prototype, 'findActivePasswordRecoveriesFromUser').resolves([Mocks.passwordReset]);

            const response = await request(server)
                .post(route)
                .send({
                    email: 'vitor@email.com'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_ONGOING_RECOVERY_PROCESS' });
        });

        it('Should not create password recovery process because som unexpected error happened', async () => {
            sinon.stub(UserDAO.prototype, 'findByEmailOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(PasswordResetDAO.prototype, 'findActivePasswordRecoveriesFromUser').resolves([]);
            sinon.stub(uuid, 'v4').returns(Mocks.passwordRecoveryToken);
            sinon.stub(UserDAO.prototype, 'save').throws(new Error('Unexpected error'));

            const response = await request(server)
                .post(route)
                .send({
                    email: 'vitor@email.com'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_FAILED' });
        });
    });

    describe('POST /reset-password', () => {
        const route = '/auth/reset-password';

        it('Should reset password successfully', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);
            sinon.stub(EncryptionUtils, 'decrypt').returns('693ecd5a-c8d9-4648-9e32-f200db2831d8');
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            // sinon.stub(ClassValidator, 'validate').resolves([]); TODO will use this
            sinon.stub(User.prototype, 'hashPassword').resolves();
            sinon.stub(UserDAO.prototype, 'save').resolves(Mocks.getRegularUser());

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true });

            clock.restore();
        });

        it('Should not reset password due to lack of new password', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_MISSING_DATA' });
        });

        it('Should not reset password due to lack of token', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_MISSING_DATA' });
        });

        it('Should not reset password due to lack of userId', async () => {
            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_MISSING_DATA' });
        });

        it('Should not reset password due to poor password complexity', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(false);

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'badpass',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_COMPLEXITY' });
        });

        it('Should not reset password because password reset process was not found', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').throws(new NotFoundError('Password reset not found'));

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_USER_NOT_FOUND' });
        });

        it('Should not reset password because password reset process has expired', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const expiredDate = Mocks.createdAt + 20000000;
            const clock = sinon.useFakeTimers(expiredDate);

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });

            clock.restore();
        });

        it('Should not reset password because provided userId is not valid', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);
            sinon.stub(EncryptionUtils, 'decrypt').throws(new DecryptError('Decrypt error'));

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-blablablablablablablab'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });

            clock.restore();
        });

        it('Should not reset password because provided userId does not match with the userId from password reset process', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);
            sinon.stub(EncryptionUtils, 'decrypt').returns('this-is-a-different-user-id');

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-blablablablablablablab'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });

            clock.restore();
        });

        it('Should not reset password because user from userId was not found', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);
            sinon.stub(EncryptionUtils, 'decrypt').returns('693ecd5a-c8d9-4648-9e32-f200db2831d8');
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found'));

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-sdsddsasads8'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });

            clock.restore();
        });

        it('Should not reset password because a password encrypt error happened', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);
            sinon.stub(EncryptionUtils, 'decrypt').returns('693ecd5a-c8d9-4648-9e32-f200db2831d8');
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'hashPassword').throws(new Error('Password encrypt error'));

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_FAILED' });

            clock.restore();
        });

        it('Should not reset password because saving user to the datase failed', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);
            sinon.stub(EncryptionUtils, 'decrypt').returns('693ecd5a-c8d9-4648-9e32-f200db2831d8');
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'hashPassword').resolves();
            sinon.stub(UserDAO.prototype, 'save').throws(new Error('Failed saving user'));

            const response = await request(server)
                .post(route)
                .send({
                    newPassword: 'newpassword123',
                    token: '81dfef16-fb58-41c2-ae07-ba72ba399734',
                    userId: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_FAILED' });

            clock.restore();
        });
    });

    describe('GET /check-password-token', () => {
        const baseUrl = '/auth/check-password-token';

        it('Should return password reset token is valid', async () => {
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            sinon.stub(EncryptionUtils, 'decrypt').returns('693ecd5a-c8d9-4648-9e32-f200db2831d8');
            const notExpiredDate = Mocks.createdAt + 1500;
            const clock = sinon.useFakeTimers(notExpiredDate);

            const response = await request(server)
                .get(`${baseUrl}?token=${Mocks.passwordRecoveryToken}&userId=${Mocks.regularUserId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true });

            clock.restore();
        });

        it('Should return invalid due to lack of token', async () => {
            const response = await request(server)
                .get(`${baseUrl}?userId=${Mocks.regularUserId}`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_TOKEN_REQUIRED' });
        });

        it('Should return invalid due to lack of user Id', async () => {
            const response = await request(server)
                .get(`${baseUrl}?token=${Mocks.passwordRecoveryToken}`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_USER_ID_REQUIRED' });
        });

        it('Should return invalid due not found password recevorey process', async () => {
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').throws(new NotFoundError('Password reset not found'));

            const response = await request(server)
                .get(`${baseUrl}?token=this-token-does-not-exist&userId=${Mocks.regularUserId}`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_TOKEN_NOT_FOUND' });
        });

        it('Should return invalid because userId is not valid', async () => {
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            sinon.stub(EncryptionUtils, 'decrypt').throws(new DecryptError('Decrypt error'));

            const response = await request(server)
                .get(`${baseUrl}?token=${Mocks.passwordRecoveryToken}&userId=${Mocks.regularUserId}`)
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_BAD_USER_ID' });
        });

        it('Should return invalid because provided userId does not match with the userId from password reset process', async () => {
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            sinon.stub(EncryptionUtils, 'decrypt').returns('this-is-a-different-user-id');

            const response = await request(server)
                .get(`${baseUrl}?token=${Mocks.passwordRecoveryToken}&userId=${Mocks.regularUserId}`)
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_RESET_TOKEN_AND_ID_NOT_MATCH' });
        });

        it('Should return invalid because token is expired', async () => {
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            sinon.stub(EncryptionUtils, 'decrypt').returns('693ecd5a-c8d9-4648-9e32-f200db2831d8');
            const expiredDate = Mocks.createdAt + 20000000;
            const clock = sinon.useFakeTimers(expiredDate);

            const response = await request(server)
                .get(`${baseUrl}?token=${Mocks.passwordRecoveryToken}&userId=${Mocks.regularUserId}`)
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'PASSWORD_TOKEN_EXPIRED' });

            clock.restore();
        });

        it('Should return invalid because some unexpected error happened', async () => {
            sinon.stub(PasswordResetDAO.prototype, 'findByTokenOrFail').resolves(Mocks.passwordReset);
            sinon.stub(EncryptionUtils, 'decrypt').throws(new Error('Unexpected error'));

            const response = await request(server)
                .get(`${baseUrl}?token=${Mocks.passwordRecoveryToken}&userId=${Mocks.regularUserId}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'CHECK_PASSWORD_TOKEN_FAILED' });
        });
    });
});
