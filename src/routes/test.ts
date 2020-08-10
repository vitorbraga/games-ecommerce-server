import { Router } from 'express';
import { TestController } from '../controllers/zz-controller';

export const testRouter = Router();

testRouter.get('/send-email', TestController.sendEmail);
