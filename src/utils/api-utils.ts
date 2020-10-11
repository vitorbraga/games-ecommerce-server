import { Request, Response } from 'express';

export interface CustomRequest<T> extends Request {
    body: T;
}

export function getUserIdFromSession(res: Response) {
    return res.locals.jwtPayload.userSession.id;
};
