import { Router } from 'express';
import { UserController } from '../controllers/user-controller';
import { checkUserId } from '../middlewares/checkUserId';
import { checkJwt } from '../middlewares/checkJwt';
import { checkRole } from '../middlewares/checkRole';

export function getUserRoutes(): Router {
    const userRouter = Router();
    const userController = new UserController();

    // Get all users
    userRouter.get('/', [checkJwt, checkRole(['ADMIN'])], userController.listAll);

    // Get one user
    userRouter.get('/:userId', [checkJwt, checkRole(['ADMIN', 'USER']), checkUserId], userController.getUserById);

    // Get one user full data
    userRouter.get('/:userId/full', [checkJwt, checkRole(['USER', 'ADMIN']), checkUserId], userController.getUserFullDataById);

    // Create a new user
    userRouter.post('/', userController.createUser);

    // Change password
    userRouter.patch('/:userId/password', [checkJwt, checkRole(['ADMIN', 'USER']), checkUserId], userController.changePassword);

    // Update one user
    userRouter.patch('/:userId', [checkJwt, checkRole(['ADMIN', 'USER']), checkUserId], userController.updateUser);

    // Change password
    userRouter.post('/change-password', [checkJwt, checkRole(['ADMIN', 'USER'])], userController.changePassword);

    // Delete one user
    userRouter.delete('/:userId', [checkJwt, checkRole(['ADMIN'])], userController.deleteUser);

    // Get user's password resets
    userRouter.get('/:userId/passwordResets', [checkJwt, checkRole(['ADMIN', 'USER']), checkUserId], userController.getUserPasswordResets);

    // Get user's addresses
    userRouter.get('/:userId/addresses', [checkJwt, checkRole(['USER']), checkUserId], userController.getUserAddresses);

    // Create a new address
    userRouter.post('/:userId/addresses', [checkJwt, checkRole(['USER']), checkUserId], userController.createAddress);

    // Set main address
    userRouter.patch('/:userId/addresses/:addressId', [checkJwt, checkRole(['USER']), checkUserId], userController.setMainAddress);

    // Delete user's address
    userRouter.delete('/:userId/addresses/:addressId', [checkJwt, checkRole(['USER']), checkUserId], userController.deleteUserAddress);

    // Get user's orders
    userRouter.get('/:userId/orders', [checkJwt, checkRole(['USER']), checkUserId], userController.getUserOrders);

    // Get user's reviews
    userRouter.get('/:userId/reviews', [checkJwt, checkRole(['USER']), checkUserId], userController.getUserReviews);

    return userRouter;
}
