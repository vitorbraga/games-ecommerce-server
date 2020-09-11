import { Router } from 'express';
import { UserController } from '../controllers/user-controller';
import { checkJwt } from '../middlewares/checkJwt';
import { checkRole } from '../middlewares/checkRole';

export function getUserRoutes(): Router {
    const userRouter = Router();
    const userController = new UserController();

    // Get all users
    userRouter.get('/', [checkJwt, checkRole(['ADMIN'])], userController.listAll);

    // Get one user
    userRouter.get('/:id', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.getUserById);

    // Create a new user
    userRouter.post('/', userController.createUser);

    // Edit one user
    userRouter.patch('/:id', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.updateUser);

    // Delete one user
    userRouter.delete('/:id', [checkJwt, checkRole(['ADMIN'])], userController.deleteUser);

    // Get user's password resets
    userRouter.get('/:id/passwordResets', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.getUserPasswordResets);

    return userRouter;
}
