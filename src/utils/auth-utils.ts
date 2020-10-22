import { jwtSecret } from '../config/config';
import * as jwt from 'jsonwebtoken';
import { UserSessionOutput } from './data-filters';

export function createSignedToken(userSession: UserSessionOutput) {
    const token = jwt.sign({ userSession }, jwtSecret, { expiresIn: '2h' });
    return token;
};
