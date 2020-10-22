import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import * as ClassValidator from 'class-validator';
import * as Mocks from './mocks';
import logger from '../../../src/utils/logger';
import * as app from '../../../src/app';
import * as JwtMiddleware from '../../../src/middlewares/checkJwt';
import * as RoleMiddleware from '../../../src/middlewares/checkRole';
import * as UserIdMiddleware from '../../../src/middlewares/checkUserId';
import { UserDAO } from '../../../src/dao/user-dao';
import { NotFoundError } from '../../../src/errors/not-found-error';
import * as Validators from '../../../src/utils/validators';
import { User } from '../../../src/entities/User';
import { CountryDAO } from '../../../src/dao/country-dao';
import { AddressDAO } from '../../../src/dao/address-dao';
import { OrderDAO } from '../../../src/dao/order-dao';

describe('User API', function () {
    let server: http.Server;

    this.beforeAll(async () => {
        // TODO Use a sqlite database for test, configure, etc
        sinon.stub(logger, 'info').returns();
        sinon.stub(JwtMiddleware, 'checkJwt').callsFake((req, res, next): any => next());
        sinon.stub(RoleMiddleware, 'checkRole')
            .callsFake(() => async (req, res, next) => {
                next();
                return undefined;
            });
        sinon.stub(UserIdMiddleware, 'checkUserId').callsFake((req, res, next): any => next());

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

    describe('GET /', () => {
        const route = '/users';

        it('Should get all users successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findAll').resolves([...Mocks.allUsers]);

            const response = await request(server)
                .get(route)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, users: [...Mocks.allUsersOutput] });
        });
    });

    describe('GET /:userId', () => {
        const baseUrl = '/users';

        it('Should get user by ID successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.regularUserOutput });
        });

        it('Should not get user due to a lack of valid userId', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
        });

        it('Should not get user because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found'));

            const response = await request(server)
                .get(`${baseUrl}/6afe4d11-6e39-4b87-b0ca-e1d04d46c3e6`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
        });
    });

    describe('GET /:userId/full', () => {
        // TODO create mocks with full data
        const baseUrl = '/users';

        it('Should get user full data by ID successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}/full`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.regularUserOutput });
        });

        it('Should not get user full data due to a lack of valid userId', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid/full`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
        });

        it('Should not get user full data because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found'));

            const response = await request(server)
                .get(`${baseUrl}/6afe4d11-6e39-4b87-b0ca-e1d04d46c3e6/full`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
        });
    });

    describe('GET /:userId/passwordResets', () => {
        const baseUrl = '/users';

        it('Should get user password resets successfully', async () => {
            sinon.stub(UserDAO.prototype, 'getPasswordResetsByUserIdOrFail').resolves(Mocks.userPasswordResets);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}/passwordResets`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, passwordResets: Mocks.userPasswordResetsOutput });
        });

        it('Should not get user password resets due to a lack of valid userId', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid/passwordResets`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
        });

        it('Should not get user full data because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'getPasswordResetsByUserIdOrFail').throws(new NotFoundError('User not found'));

            const response = await request(server)
                .get(`${baseUrl}/6afe4d11-6e39-4b87-b0ca-e1d04d46c3e6/passwordResets`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
        });
    });

    describe('POST /', () => {
        const route = '/users';

        it('Should create user successfully', async () => {
            sinon.stub(ClassValidator, 'validate').resolves([]);
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByEmail').resolves(undefined);
            sinon.stub(User.prototype, 'hashPassword').resolves();
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe',
                    email: 'jon.doe@email.com',
                    password: 'jondoe123'
                })
                .expect(201);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(userDaoSaveStub.callCount).equal(1);
        });

        it('Should not create user because of invalid firstName', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    lastName: 'Doe',
                    email: 'jon.doe@email.com',
                    password: 'jondoe123'
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(1);
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because of invalid lastName', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Jon',
                    email: 'jon.doe@email.com',
                    password: 'jondoe123'
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(1);
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because of invalid email', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe',
                    password: 'jondoe123'
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(1);
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because of invalid password', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe',
                    email: 'jon.doe@email.com'
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(1);
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because of insufficient password complexity', async () => {
            sinon.stub(ClassValidator, 'validate').resolves([]);
            sinon.stub(Validators, 'validatePasswordComplexity').returns(false);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe',
                    email: 'jon.doe@email.com',
                    password: 'password'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'REGISTER_PASSWORD_COMPLEXITY' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because email is already in use', async () => {
            sinon.stub(ClassValidator, 'validate').resolves([]);
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByEmail').resolves(Mocks.getRegularUser());
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Vitor',
                    lastName: 'Braga',
                    email: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(409);

            expect(response.body).to.deep.equal({ success: false, error: 'REGISTER_EMAIL_IN_USE' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because some error occurred during hashing password', async () => {
            sinon.stub(ClassValidator, 'validate').resolves([]);
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByEmail').resolves(undefined);
            sinon.stub(User.prototype, 'hashPassword').throws(new Error('Error while hashing password'));
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Vitor',
                    lastName: 'Braga',
                    email: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'CREATE_USER_FAILED' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user because some error occurred during save', async () => {
            sinon.stub(ClassValidator, 'validate').resolves([]);
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByEmail').resolves(undefined);
            sinon.stub(User.prototype, 'hashPassword').resolves();
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.throws(new Error('Unexpected error.'));

            const response = await request(server)
                .post(route)
                .send({
                    firstName: 'Vitor',
                    lastName: 'Braga',
                    email: 'vitor@email.com',
                    password: 'password123'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'CREATE_USER_FAILED' });
            expect(userDaoSaveStub.callCount).equal(1);
        });
    });

    describe('PATCH /:userId/password', () => {
        const baseUrl = '/users';

        it('Should change user password sucessfully', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            sinon.stub(User.prototype, 'hashPassword').resolves();
            userDaoSaveStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'password234'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(userDaoSaveStub.callCount).equal(1);
        });

        it('Should not change user password due to a lack of valid userId', async () => {
            const response = await request(server)
                .patch(`${baseUrl}/not-a-valid-uuid/password`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'password234'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
        });

        it('Should not change user password due to invalid currentPassword', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    newPassword: 'password234'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_MISSING_DATA' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not change user password due to invalid newPassword', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    currentPassword: 'password123'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_MISSING_DATA' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not change user password due to insufficient password complexity', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(false);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'password'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_COMPLEXITY' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not change user password because user was not found', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found.'));
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/8714664d-6792-49fc-a609-419646c4dcae/password`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'password234'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_USER_NOT_FOUND' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not change user password because provided password does not match with the one stored in DB', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(false);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    currentPassword: 'password444',
                    newPassword: 'password234'
                })
                .expect(401);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_INCORRECT_CURRENT_PASSWORD' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not change user password because some error occurred during hashing password', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            sinon.stub(User.prototype, 'hashPassword').throws(new Error('Some hashing error.'));
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'password234'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_FAILED' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not change user password because some error occurred during save', async () => {
            sinon.stub(Validators, 'validatePasswordComplexity').returns(true);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(User.prototype, 'checkIfUnencryptedPasswordIsValid').resolves(true);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.throws(new Error('Unexpected error.'));

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/password`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'password234'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'CHANGE_PASSWORD_FAILED' });
            expect(userDaoSaveStub.callCount).equal(1);
        });
    });

    describe('PATCH /:userId', () => {
        const baseUrl = '/users';

        it('Should update user sucessfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(ClassValidator, 'validate').resolves([]);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}`)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(userDaoSaveStub.callCount).equal(1);
        });

        it('Should not update user due to a lack of valid userId', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/not-a-valid-uuid`)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not update user due to invalid provided lastName', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}`)
                .send({
                    firstName: 'Jon'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'UPDATE_USER_MISSING_DATA' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not update user due to invalid provided firstName', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}`)
                .send({
                    lastName: 'Doe'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'UPDATE_USER_MISSING_DATA' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not update user because user was not found', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found.'));

            const response = await request(server)
                .patch(`${baseUrl}/8714664d-6792-49fc-a609-419646c4dcae`)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'UPDATE_USER_NOT_FOUND' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not update user because some error occurred on save', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.throws(new Error('Error saving user'));

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}`)
                .send({
                    firstName: 'Jon',
                    lastName: 'Doe'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'UPDATE_USER_FAILED' });
            expect(userDaoSaveStub.callCount).equal(1);
        });
    });

    describe('POST /:userId/addresses', () => {
        const baseUrl = '/users';

        it('Should create user address', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(CountryDAO.prototype, 'findById').resolves(Mocks.country);
            sinon.stub(ClassValidator, 'validate').resolves([]);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.regularUserId}/addresses`)
                .send({
                    fullName: 'Vitor Braga',
                    line1: 'Address line 1',
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
                    info: 'information',
                    mainAddress: true
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(userDaoSaveStub.callCount).equal(1);
        });

        it('Should not create user address because of invalid userId', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/not-a-valid-uuid/addresses`)
                .send({
                    fullName: 'Vitor Braga',
                    line1: 'Address line 1',
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
                    info: 'information',
                    mainAddress: true
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user address because of invalid countryId', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.regularUserId}/addresses`)
                .send({
                    fullName: 'Vitor Braga',
                    line1: 'Address line 1',
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: 'NOT-A-VALID-UUID',
                    info: 'information',
                    mainAddress: true
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_COUNTRY_ID' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user address because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(undefined);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/8a3f4e4f-10f5-4044-b164-bf9b32dfe91c/addresses`)
                .send({
                    fullName: 'Vitor Braga',
                    line1: 'Address line 1',
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
                    info: 'information',
                    mainAddress: true
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user address because country was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(CountryDAO.prototype, 'findById').resolves(undefined);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.regularUserId}/addresses`)
                .send({
                    fullName: 'Vitor Braga',
                    line1: 'Address line 1',
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
                    info: 'information',
                    mainAddress: true
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'COUNTRY_NOT_FOUND' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user address because some address fields are not valid', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(CountryDAO.prototype, 'findById').resolves(Mocks.country);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.regularUserId}/addresses`)
                .send({
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
                    info: 'information',
                    mainAddress: true
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(2);
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not create user address because some error occurred on save', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(CountryDAO.prototype, 'findById').resolves(Mocks.country);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.throws(new Error('Unexpected error'));

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.regularUserId}/addresses`)
                .send({
                    fullName: 'Vitor Braga',
                    line1: 'Address line 1',
                    line2: 'Address line 2',
                    city: 'Amsterdam',
                    zipCode: '1234 NH',
                    countryId: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
                    info: 'information',
                    mainAddress: true
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_CREATING_ADDRESS' });
            expect(userDaoSaveStub.callCount).equal(1);
        });
    });

    describe('PATCH /:userId/addresses/:addressId', () => {
        const baseUrl = '/users';

        it('Should set main address sucessfully', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(Mocks.address);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(userDaoSaveStub.callCount).equal(1);
        });

        it('Should not set main address because of invalid userId', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/not-a-valid-uuid/addresses/${Mocks.addressId}`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not set main address because of invalid addressId', async () => {
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/addresses/not-a-valid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_ADDRESS_ID' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not set main address because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(undefined);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not set main address because address was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(undefined);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'ADDRESS_NOT_FOUND' });
            expect(userDaoSaveStub.callCount).equal(0);
        });

        it('Should not set main address because some error occurred on save', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(Mocks.address);
            const userDaoSaveStub = sinon.stub(UserDAO.prototype, 'save');
            userDaoSaveStub.throws(new Error('Unexpected error'));

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'SET_MAIN_ADDRESS_FAILED' });
            expect(userDaoSaveStub.callCount).equal(1);
        });
    });

    describe('DELETE /:userId/addresses/:addressId', () => {
        const baseUrl = '/users';

        it('Should delete user address sucessfully', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(Mocks.address);
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');
            deleteUserAddressTransactionStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(deleteUserAddressTransactionStub.callCount).equal(1);
        });

        it('Should delete user address sucessfully with main address', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUserWithMainAddress());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(Mocks.address);
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');
            deleteUserAddressTransactionStub.resolves(Mocks.getNewRegularUser());

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, user: Mocks.newRegularUserOutput });
            expect(deleteUserAddressTransactionStub.callCount).equal(1);
        });

        it('Should not delete user address because of invalid userId', async () => {
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');

            const response = await request(server)
                .delete(`${baseUrl}/not-a-valid-uuid/addresses/${Mocks.addressId}`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
            expect(deleteUserAddressTransactionStub.callCount).equal(0);
        });

        it('Should not delete user address because of invalid addressId', async () => {
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}/addresses/not-a-valid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_ADDRESS_ID' });
            expect(deleteUserAddressTransactionStub.callCount).equal(0);
        });

        it('Should not delete user address because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(undefined);
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
            expect(deleteUserAddressTransactionStub.callCount).equal(0);
        });

        it('Should not delete user address because address was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(undefined);
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'ADDRESS_NOT_FOUND' });
            expect(deleteUserAddressTransactionStub.callCount).equal(0);
        });

        it('Should not delete user address because some error occurred on transaction', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findById').resolves(Mocks.address);
            const deleteUserAddressTransactionStub = sinon.stub(AddressDAO.prototype, 'deleteUserAddressTransaction');
            deleteUserAddressTransactionStub.throws(new Error('Uncexpected error on transaction'));

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}/addresses/${Mocks.addressId}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'DELETE_ADDRESS_FAILED' });
            expect(deleteUserAddressTransactionStub.callCount).equal(1);
        });
    });

    describe('GET /:userId/orders', () => {
        const baseUrl = '/users';

        // TODO implement with order objects, not empty array
        it('Should get user orders successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(OrderDAO.prototype, 'getOrdersByUser').resolves([]);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}/orders`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, orders: [] });
        });

        it('Should not get user orders because user id is invalid', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-valid-id/orders`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
        });

        it('Should not get user orders because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(undefined);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}/orders`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
        });

        it('Should not get user orders because some unexpected error occurred', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            sinon.stub(OrderDAO.prototype, 'getOrdersByUser').throws(new Error('Unexpected error'));

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}/orders`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FETCHING_USER_ORDERS_FAILED' });
        });
    });

    describe('DELETE /:userId', () => {
        const baseUrl = '/users';

        it('Should delete user successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            const userDaoDeleteStub = sinon.stub(UserDAO.prototype, 'deleteById');
            userDaoDeleteStub.resolves();

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true });
            expect(userDaoDeleteStub.callCount).equal(1);
        });

        it('Should not delete user because user id is invalid', async () => {
            const userDaoDeleteStub = sinon.stub(UserDAO.prototype, 'deleteById');

            const response = await request(server)
                .delete(`${baseUrl}/not-valid-id`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
            expect(userDaoDeleteStub.callCount).equal(0);
        });

        it('Should not delete user because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(undefined);
            const userDaoDeleteStub = sinon.stub(UserDAO.prototype, 'deleteById');

            const response = await request(server)
                .delete(`${baseUrl}/57dc5703-623f-412e-af2f-a98972051288`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
            expect(userDaoDeleteStub.callCount).equal(0);
        });

        it('Should not delete user because some error occurred on delete', async () => {
            sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());
            const userDaoDeleteStub = sinon.stub(UserDAO.prototype, 'deleteById');
            userDaoDeleteStub.throws(new Error('Unexpected error'));

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.regularUserId}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'DELETE_USER_FAILED' });
            expect(userDaoDeleteStub.callCount).equal(1);
        });
    });

    describe('GET /:userId/addresses', () => {
        const baseUrl = '/users';

        it('Should get user addresses successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUserWithAddresses());

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.regularUserId}/addresses`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, addresses: [Mocks.addressOutput] });
        });

        it('Should not get user addresses because user id is invalid', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid/addresses`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_USER_ID' });
        });

        it('Should not get user addresses because user was not found', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found'));

            const response = await request(server)
                .get(`${baseUrl}/57dc5703-623f-412e-af2f-a98972051288/addresses`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
        });

        it('Should not get user addresses because some enexpected error happened', async () => {
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new Error('Unexpected error'));

            const response = await request(server)
                .get(`${baseUrl}/57dc5703-623f-412e-af2f-a98972051288/addresses`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FETCHING_USER_ADDRESSES_FAILED' });
        });
    });
});
