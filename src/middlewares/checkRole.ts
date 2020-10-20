import { Request, Response, NextFunction } from 'express';
import { UserDAO } from '../dao/user-dao';

export const checkRole = (roles: Array<string>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Get the user ID from previous midleware
        const userPayload = res.locals.jwtPayload.userSession;

        // Get user role from the database
        const userDAO = new UserDAO();

        const user = await userDAO.findById(userPayload.id);
        if (!user) {
            res.setHeader('WWW-Authenticate', 'Bearer realm="DefaultRealm"');
            return res.status(401).send({ success: false, error: 'Could not find user from token.' });
        }

        // Check if array of authorized roles includes the user's role
        if (roles.indexOf(user.role) > -1) {
            next();
        } else {
            res.setHeader('WWW-Authenticate', 'Bearer realm="DefaultRealm"');
            return res.status(401).send({ success: false, error: 'User does not have proper permission.' });
        }
    };
};
