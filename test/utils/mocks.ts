import { Order } from '../../src/entity/Order';
import { OrderItem } from '../../src/entity/OrderItem';
import { Product } from '../../src/entity/Product';

export function getOrder(): Order {
    const product1 = new Product();
    product1.title = 'Product 1';
    product1.price = 12000;

    const product2 = new Product();
    product2.title = 'Product 2';
    product2.price = 98000;

    const order = new Order();
    order.shippingCosts = 1200;

    const orderItem1 = new OrderItem();
    orderItem1.product = product1;
    orderItem1.quantity = 1;

    const orderItem2 = new OrderItem();
    orderItem2.product = product2;
    orderItem2.quantity = 2;

    order.orderItems = [orderItem1, orderItem2];

    return order;
}
