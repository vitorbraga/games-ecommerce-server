import { Router } from 'express';

export function getTestRouter(): Router {
    const testRouter = Router();

    testRouter.get('/', (req, res) => {
        res.send({ success: true, message: 'Test response.' });
    });

    return testRouter;
}
