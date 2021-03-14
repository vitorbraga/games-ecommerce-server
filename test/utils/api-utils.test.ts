import { expect } from 'chai';
import { Response } from 'express';
import * as ApiUtils from '../../src/utils/api-utils';
import * as Mocks from './mocks';

describe('API Utils', function () {
    describe('getUserIdFromSession', function () {
        it('Should getUserIdFromSession', () => {
            const response = Mocks.getResponseWithJwt() as unknown as Response;
            const result = ApiUtils.getUserIdFromSession(response);
            expect(result).equal(Mocks.userIdInsideResponse);
        });

        it('Should not getUserIdFromSession because there is not jwt', () => {
            const response = Mocks.getResponseWithoutJwt() as unknown as Response;
            const result = ApiUtils.getUserIdFromSession(response);
            expect(result).equal(undefined);
        });
    });

    describe('getFilesFromRequest', function () {
        it('Should getFilesFromRequest', () => {
            const request = Mocks.getRequestWithFiles();
            const files = ApiUtils.getFilesFromRequest(request);
            expect(files.length).equal(0);
        });
    });
});
