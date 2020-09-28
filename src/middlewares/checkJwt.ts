import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/config';

function extractTokenFromBearerAuthorization(authorization: string) {
    return authorization.substring(authorization.indexOf('Bearer ') + 7);
}

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorization = req.headers.authorization as string;
        const token = extractTokenFromBearerAuthorization(authorization);

        const jwtPayload = jwt.verify(token, jwtConfig.secret) as any;
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        res.setHeader('WWW-Authenticate', 'Bearer realm="DefaultRealm"');
        return res.status(401).send({ success: false, error: 'Token is not valid.' });
    }

    next();
};
