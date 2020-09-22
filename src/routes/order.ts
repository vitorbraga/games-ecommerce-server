import { Router } from 'express';
import { OrderController } from '../controllers/order-controller';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';

export function getOrdersRouter(): Router {
    const orderController = new OrderController();
    const ordersRouter = Router();

    ordersRouter.get('/:id', orderController.getOrder);

    ordersRouter.get('/order-number/:orderNumber', orderController.getByOrderNumber);

    ordersRouter.post('/', [checkJwt, checkRole(['USER'])], orderController.createOrder);

    return ordersRouter;
}
