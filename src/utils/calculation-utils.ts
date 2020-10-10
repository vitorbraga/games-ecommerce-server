import * as Dinero from 'dinero.js';
import { Order } from '../entity/Order';
import { OrderItem } from '../entity/OrderItem';

export function calculateOrderItemsTotal(orderItems: OrderItem[]): number {
    return orderItems.reduce((prev, cur) => {
        return Dinero({ amount: cur.product.price }).multiply(cur.quantity).add(Dinero({ amount: prev })).getAmount();
    }, 0);
}

export function calculateOrderTotalValue(order: Order): number {
    const orderItemsTotal = calculateOrderItemsTotal(order.orderItems);
    return Dinero({ amount: orderItemsTotal }).add(Dinero({ amount: order.shippingCosts })).getAmount();
}
