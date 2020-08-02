import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './user';
import { testRouter } from './test';

export const routes = Router();

routes.use('/auth', authRouter);
routes.use('/user', userRouter);
routes.use('/test', testRouter);
