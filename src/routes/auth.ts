import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { checkJwt } from '../middlewares/checkJwt';
import { checkRole } from '../middlewares/checkRole';

export function getAuthRoutes(): Router {
    const authController = new AuthController();
    const authRouter = Router();
    
    // Login route
    authRouter.post('/login', authController.login);
    
    // Admin login route
    authRouter.post('/admin/login', authController.loginAdmin);
    
    // Change my password
    authRouter.post('/change-password', [checkJwt, checkRole(['ADMIN', 'USER'])], authController.changePassword);
    
    // Generate password recovery token
    authRouter.post('/password-recovery', [], authController.passwordRecoveryProcess);
    
    authRouter.post('/reset-password', [], authController.resetPassword);
    
    authRouter.get('/check-password-token/:token/:userId', [], authController.checkPasswordToken);

    return authRouter;
}
