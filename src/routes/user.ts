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

    // Get one user full data
    userRouter.get('/:id/full', [checkJwt, checkRole(['USER'])], userController.getUserFullDataById);

    // Create a new user
    userRouter.post('/', userController.createUser);

    // Edit one user
    userRouter.patch('/:id', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.updateUser);

    // Delete one user
    userRouter.delete('/:id', [checkJwt, checkRole(['ADMIN'])], userController.deleteUser);

    // Get user's password resets
    userRouter.get('/:id/passwordResets', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.getUserPasswordResets);

    // Get user's addresses
    userRouter.get('/:id/addresses', [checkJwt, checkRole(['USER'])], userController.getUserAddresses);

    // Create a new address
    userRouter.post('/:id/addresses', [checkJwt, checkRole(['USER'])], userController.createAddress);

    // Set main address
    userRouter.patch('/:userId/addresses/:addressId', [checkJwt, checkRole(['USER'])], userController.setMainAddress);

    // Delete user's address
    userRouter.delete('/:userId/addresses/:addressId', [checkJwt, checkRole(['USER'])], userController.deleteUserAddress);

    // Get user's orders
    userRouter.get('/:id/orders', [checkJwt, checkRole(['USER'])], userController.getUserOrders);

    return userRouter;
}
