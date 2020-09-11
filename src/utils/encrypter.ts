import * as crypto from 'crypto';
import { DecryptError } from '../errors/decrypt-error';

export const encrypt = (textToEncrypt: string): string => {
    const cipher = crypto.createCipheriv('aes-128-cbc', process.env.ENCRYPT_SECRET, null);
    let encryptedText = cipher.update(textToEncrypt, 'utf8', 'hex');
    encryptedText += cipher.final('hex');

    return encryptedText;
};

export const decrypt = (encryptedText: string): string => {
    try {
        const decipher = crypto.createDecipheriv('aes-128-cbc', process.env.ENCRYPT_SECRET, null);
        let decryptedText = decipher.update(encryptedText, 'hex', 'utf8');
        decryptedText += decipher.final('utf8');

        return decryptedText;
    } catch (error) {
        throw new DecryptError('Decrypt error.');
    }
};
