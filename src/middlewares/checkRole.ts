import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

export const checkRole = (roles: Array<string>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Get the user ID from previous midleware
        const id = res.locals.jwtPayload.userId;

        // Get user role from the database
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail(id);
        } catch (id) {
            res.status(401).send({ success: false, error: 'Could not find user from token.' });
            return;
        }

        // Check if array of authorized roles includes the user's role
        if (roles.indexOf(user.role) > -1) {
            next();
        } else {
            res.status(401).send({ success: false, error: 'User does not have proper permission.' });
        }
    };
};
