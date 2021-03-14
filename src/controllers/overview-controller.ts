import { Request, Response } from 'express';
import { OrderDAO } from '../dao/order-dao';
import { UserDAO } from '../dao/user-dao';
import logger from '../utils/logger';

export class OverviewController {
    private orderDAO: OrderDAO;
    private userDAO: UserDAO;

    constructor() {
        this.orderDAO = new OrderDAO();
        this.userDAO = new UserDAO();
    }

    public getOverview = async (req: Request, res: Response) => {
        try {
            const users = await this.userDAO.findAll();

            const orders = await this.orderDAO.findAll();

            return res.json({ success: true, overview: { users: users.length, orders: orders.length } });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'GETTING_OVERVIEW_FAILED' });
        }
    };
}
