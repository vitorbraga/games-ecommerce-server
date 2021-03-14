import { Router } from 'express';
import { OverviewController } from '../controllers/overview-controller';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';

export function getOverviewRouter(): Router {
    const overviewController = new OverviewController();
    const overviewRouter = Router();

    overviewRouter.get('/', [checkJwt, checkRole(['ADMIN'])], overviewController.getOverview);

    return overviewRouter;
}
