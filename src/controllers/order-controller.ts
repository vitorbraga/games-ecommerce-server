import { Request, Response } from 'express';
import { AddressDAO } from '../dao/address-dao';
import { OrderDAO } from '../dao/order-dao';
import { ProductDAO } from '../dao/product-dao';
import { UserDAO } from '../dao/user-dao';
import { OrderStatus } from '../entity/model';
import { Order } from '../entity/Order';
import { OrderItem } from '../entity/OrderItem';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest } from '../utils/api-utils';
import * as CalculationUtils from '../utils/calculation-utils';
import { buildOrderOutput } from '../utils/data-filters';

interface CreateOrderBody {
    orderItems: {
        productId: string;
        quantity: number;
    }[];
    addressId: string;
    deliveryFee: number;
}

export class OrderController {
    private orderDAO: OrderDAO;
    private addressDAO: AddressDAO;
    private productDAO: ProductDAO;
    private userDAO: UserDAO;

    constructor() {
        this.orderDAO = new OrderDAO();
        this.addressDAO = new AddressDAO();
        this.productDAO = new ProductDAO();
        this.userDAO = new UserDAO();
    }

    public getOrder = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_ORDER_ID' });
            }

            const orderId: string = req.params.id;

            const order = await this.orderDAO.findByIdOrFail(orderId);
            return res.json({ success: true, order: buildOrderOutput(order) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'ORDER_NOT_FOUND' });
        }
    };

    public getByOrderNumber = async (req: Request, res: Response) => {
        try {
            if (!req.params.orderNumber) {
                return res.status(422).json({ success: false, error: 'MISSING_ORDER_NUMBER' });
            }

            const orderNumber: string = req.params.orderNumber;

            const order = await this.orderDAO.findByOrderNumberOrFail(orderNumber);
            return res.json({ success: true, order: buildOrderOutput(order) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'ORDER_NOT_FOUND' });
        }
    };

    private generateOrderNumber = async (): Promise<string> => {
        let count = 1;
        let existingOrder: Order | undefined = undefined;

        do {
            count = await this.orderDAO.getCountOfOrders();
            count = count + 1;
            existingOrder = await this.orderDAO.findByOrderNumber(count.toString());
        } while (existingOrder !== undefined);

        return count.toString();
    };

    public createOrder = async (req: CustomRequest<CreateOrderBody>, res: Response) => {
        const id = res.locals.jwtPayload.user.id;
        const order = new Order();
        order.deliveryFee = req.body.deliveryFee;
        order.orderItems = [];

        try {
            const user = await this.userDAO.findByIdOrFail(id);
            order.user = user;
        } catch (error) {
            return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }

        try {
            const deliveryAddress = await this.addressDAO.findByIdOrFail(req.body.addressId);
            order.deliveryAddress = deliveryAddress;
        } catch (error) {
            return res.status(404).send({ success: false, error: 'ADDRESS_NOT_FOUND' });
        }

        try {
            for (const orderItem of req.body.orderItems) {
                const product = await this.productDAO.findByIdOrFail(orderItem.productId);
                const newOrderItem = new OrderItem();
                newOrderItem.product = product;
                newOrderItem.quantity = orderItem.quantity;

                order.orderItems.push(newOrderItem);
            }

            order.total = CalculationUtils.calculateOrderTotalValue(order);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            } else {
                return res.status(500).send({ success: false, error: 'FAILED_MANAGING_ORDER_ITEMS' });
            }
        }

        try {
            order.status = OrderStatus.AWAITING_PAYMENT;

            order.orderNumber = await this.generateOrderNumber();

            const newOrder = await this.orderDAO.save(order);

            return res.status(200).send({ success: true, order: newOrder });
        } catch (e) {
            return res.status(500).send({ success: false, error: 'FAILED_CREATING_ORDER' });
        }
    };
}
