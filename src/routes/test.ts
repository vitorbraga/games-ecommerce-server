import { Router } from 'express';
import { TestController } from '../controllers/test-controller';

export const testRouter = Router();

testRouter.get('/send-email', TestController.sendEmail);
