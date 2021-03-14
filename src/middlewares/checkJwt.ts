import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/config';

export function extractTokenFromBearerAuthorization(authorization: string) {
    return authorization.substring(authorization.indexOf('Bearer ') + 7);
}

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorization = req.headers.authorization as string;
        const token = extractTokenFromBearerAuthorization(authorization);

        const jwtPayload = jwt.verify(token, jwtSecret);
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="DefaultRealm"');
        return res.status(401).send({ success: false, error: 'Token is not valid.' });
    }

    next();
};
