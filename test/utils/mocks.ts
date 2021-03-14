import * as express from 'express';
import { Order } from '../../src/entities/Order';
import { OrderItem } from '../../src/entities/OrderItem';
import { Product } from '../../src/entities/Product';
import { UserSessionOutput } from '../../src/utils/data-filters';

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

export const userIdInsideResponse = '8b07ff13-8580-41ff-8f8c-b51b7fee3511';
export function getResponseWithJwt(): express.Response {
    const response = express.response;

    response.locals = {};
    response.locals.jwtPayload = {
        userSession: {
            id: userIdInsideResponse
        }
    };

    return response as unknown as express.Response;
}

export function getResponseWithoutJwt(): express.Response {
    const response = express.response;
    response.locals = {};
    return response as unknown as express.Response;
}

export function getRequestWithFiles(): express.Request {
    const request = express.request;
    request.files = [];
    return request as unknown as express.Request;
}

export function getUserSessionOutput(): UserSessionOutput {
    return {
        id: userIdInsideResponse,
        firstName: 'Vitor'
    };
}

export const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const rawText = 'text-to-encrypt';
export const encryptedText = '9de3fa48aed34efdd6a3352b710bf9d2';
