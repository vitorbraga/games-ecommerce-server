import { expect } from 'chai';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';
import * as Mocks from './mocks';
import * as CheckUserIdMiddleware from '../../src/middlewares/checkUserId';

describe('checkUserId middleware', function () {
    this.afterEach(() => {
        sinon.restore();
    });

    it('Should pass because userId from params is the same as in jwt payload', () => {
        const middleware = CheckUserIdMiddleware.checkUserId;
        const nextSpy = sinon.spy();

        const request = httpMocks.createRequest({ params: { userId: Mocks.regularUserId } });
        const response = httpMocks.createResponse({ locals: Mocks.validLocals });

        middleware(request, response, nextSpy);

        expect(nextSpy.callCount).equal(1);
    });

    it('Should return error because userId from params is not the same as in jwt payload', () => {
        const middleware = CheckUserIdMiddleware.checkUserId;
        const nextSpy = sinon.spy();

        const request = httpMocks.createRequest({ params: { userId: Mocks.regularUserId } });
        const response = httpMocks.createResponse({ locals: Mocks.invalidLocals });

        middleware(request, response, nextSpy);

        expect(nextSpy.callCount).equal(0);
        expect(response.statusCode).equal(403);
        expect(response._getData()).to.deep.equal({ success: false, error: 'You are not allowed to perform this operation.' });
    });
});
