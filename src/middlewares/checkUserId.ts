import { Request, Response, NextFunction } from 'express';

export const checkUserId = (req: Request, res: Response, next: NextFunction) => {
    const { id: userIdFromSession } = res.locals.jwtPayload.userSession;
    const userIdFromParams = req.params.userId;

    if (userIdFromSession !== userIdFromParams) {
        return res.status(403).send({ success: false, error: 'You are not allowed to perform this operation.' });
    }

    next();
};
