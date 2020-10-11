import { Request, Response } from 'express';
import { AddressDAO } from '../dao/address-dao';
import { OrderDAO } from '../dao/order-dao';
import { ProductDAO } from '../dao/product-dao';
import { UserDAO } from '../dao/user-dao';
import { OrderStatus } from '../entity/model';
import { Order } from '../entity/Order';
import { OrderItem } from '../entity/OrderItem';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest, getUserIdFromSession } from '../utils/api-utils';
import * as CalculationUtils from '../utils/calculation-utils';
import * as PaymentValidator from '../utils/payment-validator';
import { buildOrderOutput } from '../utils/data-filters';
import * as Validators from '../utils/validators';
import logger from '../utils/logger';

interface CreateOrderBody {
    orderItems: {
        productId: string;
        quantity: number;
    }[];
    addressId: string;
    shippingCosts: number;
    paymentInfo: {
        name: string;
        cardNumber: string;
        expirationDate: string;
        securityCode: string;
    };
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
            if (!Validators.validateUuidV4(req.params.id)) {
                return res.status(422).json({ success: false, error: 'MISSING_ORDER_ID' });
            }

            const orderId: string = req.params.id;

            const order = await this.orderDAO.findById(orderId);
            if (!order) {
                return res.status(404).send({ success: false, error: 'ORDER_NOT_FOUND' });
            }

            return res.json({ success: true, order: buildOrderOutput(order) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_RETRIEVING_ORDER' });
        }
    };

    public getByOrderNumber = async (req: Request, res: Response) => {
        try {
            const orderNumber: string = req.params.orderNumber;

            const order = await this.orderDAO.findByOrderNumber(orderNumber);
            if (!order) {
                return res.status(404).send({ success: false, error: 'ORDER_NOT_FOUND' });
            }

            return res.json({ success: true, order: buildOrderOutput(order) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_RETRIEVING_ORDER' });
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
        const id = getUserIdFromSession(res);

        const order = new Order();
        order.shippingCosts = req.body.shippingCosts;
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
                if (orderItem.quantity > product.quantityInStock) {
                    return res.status(422).send({ success: false, error: 'PRODUCT_OUT_OF_STOCK' });
                }

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
            const creditCardNumber = req.body.paymentInfo.cardNumber.trim().replace(/ /g, '');
            if (PaymentValidator.validatePayment(creditCardNumber)) {
                // Order will be created and stock will be deducted
                order.status = OrderStatus.AWAITING_DELIVERY;

                order.orderNumber = await this.generateOrderNumber();

                const newOrder = await this.orderDAO.createOrderTransaction(order);
                if (!newOrder) {
                    throw new Error('Failed creating order');
                }

                return res.status(200).send({ success: true, order: buildOrderOutput(newOrder) });
            } else {
                // Payment failed. Order will not be created.
                return res.status(500).send({ success: false, error: 'PAYMENT_FAILED' });
            }
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_CREATING_ORDER' });
        }
    };
}
