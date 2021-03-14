import { expect } from 'chai';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';
import * as Mocks from './mocks';
import * as CheckJwtMiddleware from '../../src/middlewares/checkJwt';

describe('checkJwt middleware', function () {
    describe('extractTokenFromBearerAuthorization', function () {
        it('Should return a valid token', () => {
            const result = CheckJwtMiddleware.extractTokenFromBearerAuthorization(Mocks.validAuthorizationHeader);
            expect(result).equal(Mocks.validJwtToken);
        });

        it('Should not return a valid token', () => {
            const result = CheckJwtMiddleware.extractTokenFromBearerAuthorization(Mocks.invalidauthorizationHeader);
            expect(result).equal(Mocks.invalidJwtToken);
        });
    });

    describe('checkJwt', function () {
        it('Should add right data from token to locals object', function () {
            const middleware = CheckJwtMiddleware.checkJwt;
            const nextSpy = sinon.spy();

            const request = httpMocks.createRequest({ headers: Mocks.validHeaders });
            const response = httpMocks.createResponse();

            middleware(request, response, nextSpy);

            expect(nextSpy.callCount).equal(1);
            expect(response.locals).to.deep.equal(Mocks.validLocals);
        });

        it('Should return error because of invalid token', function () {
            const middleware = CheckJwtMiddleware.checkJwt;
            const nextSpy = sinon.spy();

            const request = httpMocks.createRequest({ headers: Mocks.invalidHeaders });
            const response = httpMocks.createResponse();

            middleware(request, response, nextSpy);

            expect(nextSpy.callCount).equal(0);
            expect(response.statusCode).equal(401);
            expect(response.header('WWW-Authenticate')).equal('Bearer realm="DefaultRealm"');
            expect(response._getData()).to.deep.equal({ success: false, error: 'Token is not valid.' });
        });
    });
});
