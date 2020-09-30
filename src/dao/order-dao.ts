import { getManager, getRepository, Repository } from 'typeorm';
import { Order } from '../entity/Order';
import { NotFoundError } from '../errors/not-found-error';

export class OrderDAO {
    private orderRepository: Repository<Order>;

    constructor() {
        this.orderRepository = getRepository(Order);
    }

    public async save(order: Order): Promise<Order> {
        const savedOrder = await this.orderRepository.save(order);
        return savedOrder;
    }

    public async createOrderTransaction(order: Order): Promise<Order | null> {
        let newOrder: Order | null = null;
        await getManager().transaction(async (transactionalEntityManager) => {
            for (const orderItem of order.orderItems) {
                const { product } = orderItem;
                product.quantityInStock = product.quantityInStock - orderItem.quantity;
                if (product.quantityInStock < 0) {
                    throw new Error('Quantity not available in stock');
                }
                await transactionalEntityManager.save(product);
            }

            newOrder = await transactionalEntityManager.save(order);
        });

        return newOrder;
    }

    public async findAll(): Promise<Order[]> {
        const orders = await this.orderRepository.find();
        return orders;
    }

    public async findById(orderId: string): Promise<Order | undefined> {
        const order = await this.orderRepository.findOne(orderId);
        return order;
    }

    public async findByIdOrFail(orderId: string): Promise<Order> {
        try {
            const order = await this.orderRepository.findOneOrFail(orderId);
            return order;
        } catch (error) {
            throw new NotFoundError('Order not found.');
        }
    }

    public async findByOrderNumberOrFail(orderNumber: string): Promise<Order> {
        try {
            const order = await this.orderRepository.findOneOrFail({ where: { orderNumber } });
            return order;
        } catch (error) {
            throw new NotFoundError('Order not found.');
        }
    }

    public async findByOrderNumber(orderNumber: string): Promise<Order | undefined> {
        const order = await this.orderRepository.findOne({ where: { orderNumber } });
        return order;
    }

    public async delete(orderId: string): Promise<void> {
        await this.orderRepository.delete(orderId);
    }

    public async getCountOfOrders(): Promise<number> {
        const count = await this.orderRepository.count();
        return count;
    }

    public async getOrdersByUser(userId: string): Promise<Order[]> {
        const orders = await this.orderRepository.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
        return orders;
    }
}
