import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/config';

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
    // Get the jwt token from the head
    const token = req.headers.auth as string;
    let jwtPayload;

    // Try to validate the token and get data
    try {
        jwtPayload = jwt.verify(token, jwtConfig.secret) as any;
        res.locals.jwtPayload = jwtPayload;
    } catch (error) {
        // If token is not valid, respond with 401 (unauthorized)
        res.status(401).send({ success: false, error: 'Token is not valid.' });
        return;
    }

    // The token is valid for 2 hour
    // We want to send a new token on every request
    const { userId, email } = jwtPayload;
    const newToken = jwt.sign({ userId, email }, jwtConfig.secret, {
        expiresIn: '2h'
    });
    res.setHeader('token', newToken);

    // Call the next middleware or controller
    next();
};
