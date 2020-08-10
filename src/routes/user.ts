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
    userRouter.get('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.getUserById);
    
    // Create a new user
    userRouter.post('/', userController.newUser);
    
    // Edit one user
    userRouter.patch('/:id([0-9]+)', [checkJwt, checkRole(['USER'])], userController.updateUser);
    
    // Delete one user
    userRouter.delete('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN'])], userController.deleteUser);

    return userRouter;
}
