import { expect } from 'chai';
import * as Mocks from './mocks';
import * as EncryptionUtils from '../../src/utils/encryption-utils';
import * as crypto from 'crypto';
import * as sinon from 'sinon';

describe('Encryption Utils', function () {
    describe('encrypt', function () {
        it('Encrypted text should match', () => {
            process.env.ENCRYPT_SECRET = 'my-test-secret16';
            process.env.ENCRYPT_IV = '1234567890abcdef';
            const result = EncryptionUtils.encrypt(Mocks.rawText);

            expect(result).equal(Mocks.encryptedText);
        });
    });

    describe('decrypt', function () {
        it('Decrypted text should match', () => {
            process.env.ENCRYPT_SECRET = 'my-test-secret16';
            process.env.ENCRYPT_IV = '1234567890abcdef';
            const result = EncryptionUtils.decrypt(Mocks.encryptedText);

            expect(result).equal(Mocks.rawText);
        });

        it('Decrypting should throw error', () => {
            sinon.stub(crypto, 'createDecipheriv').throws(new Error('Some error occurred'));
            expect(() => {
                EncryptionUtils.decrypt(Mocks.encryptedText);
            }).to.throw('Decrypt error.');
        });
    });
});
