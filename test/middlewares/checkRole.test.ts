import { expect } from 'chai';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';
import * as Mocks from './mocks';
import * as TypeOrm from 'typeorm';
import * as CheckRoleMiddleware from '../../src/middlewares/checkRole';
import { UserDAO } from '../../src/dao/user-dao';

describe('checkRole middleware', function () {
    this.afterEach(() => {
        sinon.restore();
    });

    it('Should pass because user has the same role as required', async () => {
        const middleware = CheckRoleMiddleware.checkRole(['USER']);
        const nextSpy = sinon.spy();
        sinon.stub(TypeOrm, 'getRepository').withArgs('User').returns({} as any);
        sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());

        const request = httpMocks.createRequest();
        const response = httpMocks.createResponse({ locals: Mocks.validLocals });

        await middleware(request, response, nextSpy);

        expect(nextSpy.callCount).equal(1);
    });

    it('Should return error because user was not found', async () => {
        const middleware = CheckRoleMiddleware.checkRole(['USER']);
        const nextSpy = sinon.spy();
        sinon.stub(TypeOrm, 'getRepository').withArgs('User').returns({} as any);
        sinon.stub(UserDAO.prototype, 'findById').resolves(undefined);

        const request = httpMocks.createRequest();
        const response = httpMocks.createResponse({ locals: Mocks.invalidLocals });

        await middleware(request, response, nextSpy);

        expect(nextSpy.callCount).equal(0);
        expect(response.statusCode).equal(401);
        expect(response.header('WWW-Authenticate')).equal('Bearer realm="DefaultRealm"');
        expect(response._getData()).to.deep.equal({ success: false, error: 'Could not find user from token.' });
    });

    it('Should return error because user does not have proper permission', async () => {
        const middleware = CheckRoleMiddleware.checkRole(['ADMIN']);
        const nextSpy = sinon.spy();
        sinon.stub(TypeOrm, 'getRepository').withArgs('User').returns({} as any);
        sinon.stub(UserDAO.prototype, 'findById').resolves(Mocks.getRegularUser());

        const request = httpMocks.createRequest();
        const response = httpMocks.createResponse({ locals: Mocks.validLocals });

        await middleware(request, response, nextSpy);

        expect(nextSpy.callCount).equal(0);
        expect(response.statusCode).equal(401);
        expect(response.header('WWW-Authenticate')).equal('Bearer realm="DefaultRealm"');
        expect(response._getData()).to.deep.equal({ success: false, error: 'User does not have proper permission.' });
    });
});
