import { expect } from 'chai';
import * as jwt from 'jsonwebtoken';
import * as AuthUtils from '../../src/utils/auth-utils';
import * as Mocks from './mocks';

describe('Auth Utils', function () {
    describe('getUserIdFromSession', function () {
        it('Should getUserIdFromSession', () => {
            const userSessionOutput = Mocks.getUserSessionOutput();
            const token = AuthUtils.createSignedToken(userSessionOutput);

            const decoded = jwt.decode(token) as { [key: string]: any };
            expect(decoded.userSession).to.deep.equal(Mocks.getUserSessionOutput());
        });
    });
});
