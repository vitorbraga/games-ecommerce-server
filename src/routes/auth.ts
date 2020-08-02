import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { checkJwt } from '../middlewares/checkJwt';
import { checkRole } from '../middlewares/checkRole';

export const authRouter = Router();
// Login route
authRouter.post('/login', AuthController.login);

// Change my password
authRouter.post('/change-password', [checkJwt, checkRole(['ADMIN', 'USER'])], AuthController.changePassword);

// Generate password recovery token
authRouter.post('/password-recovery', [], AuthController.passwordRecoveryProcess);

authRouter.post('/reset-password', [], AuthController.resetPassword);

authRouter.get('/check-password-token/:token/:userId', [], AuthController.checkPasswordToken);
