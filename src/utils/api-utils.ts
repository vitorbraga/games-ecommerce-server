import { Request, Response } from 'express';

export interface CustomRequest<T> extends Request {
    body: T;
}

export function getUserIdFromSession(res: Response): string | undefined {
    return res.locals.jwtPayload?.userSession.id;
};

export function getFilesFromRequest(req: Request): Express.MulterS3.File[] {
    return req.files as Express.MulterS3.File[];
};
