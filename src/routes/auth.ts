import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';

export function getAuthRoutes(): Router {
    const authController = new AuthController();
    const authRouter = Router();

    authRouter.post('/login', authController.login);

    authRouter.post('/admin/login', authController.loginAdmin);

    authRouter.post('/password-recovery', authController.passwordRecoveryProcess);

    authRouter.post('/reset-password', authController.resetPassword);

    authRouter.get('/check-password-token', authController.checkPasswordTokenValid);

    return authRouter;
}
