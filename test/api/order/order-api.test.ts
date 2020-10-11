import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import * as Mocks from './mocks';
import logger from '../../../src/utils/logger';
import * as app from '../../../src/app';
import * as JwtMiddleware from '../../../src/middlewares/checkJwt';
import * as RoleMiddleware from '../../../src/middlewares/checkRole';
import * as ApiUtils from '../../../src/utils/api-utils';
import * as CalculationUtils from '../../../src/utils/calculation-utils';
import { OrderDAO } from '../../../src/dao/order-dao';
import { UserDAO } from '../../../src/dao/user-dao';
import { AddressDAO } from '../../../src/dao/address-dao';
import { ProductDAO } from '../../../src/dao/product-dao';
import { NotFoundError } from '../../../src/errors/not-found-error';

describe('Country API', function () {
    let server: http.Server;

    this.beforeAll(async () => {
        // TODO Use a sqlite database for test, configure, etc
        sinon.stub(logger, 'info').returns();
        sinon.stub(JwtMiddleware, 'checkJwt')
            .callsFake((req, res, next): any => {
                next();
            });
        sinon.stub(RoleMiddleware, 'checkRole')
            .callsFake(() => async (req, res, next) => {
                next();
                return undefined;
            });

        server = await app.start();

        return Promise.resolve();
    });

    this.beforeEach(async () => {
        sinon.stub(logger, 'error').returns();
    });

    this.afterEach(async () => {
        sinon.restore();
    });

    this.afterAll(async () => {
        await server.close();
        app.shutdown();

        return Promise.resolve();
    });

    describe('GET /:orderId', () => {
        const baseUrl = '/orders';

        it('Should get order by id successfully', async () => {
            sinon.stub(OrderDAO.prototype, 'findById').resolves(Mocks.getOrder());

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.orderId}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, order: Mocks.orderOutput });
        });

        it('Should not get order because id is invalid', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_ORDER_ID' });
        });

        it('Should not get order because order was not found', async () => {
            sinon.stub(OrderDAO.prototype, 'findById').resolves(undefined);

            const response = await request(server)
                .get(`${baseUrl}/a7e75da4-2556-484c-a6d7-f8c497c8b2e7`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'ORDER_NOT_FOUND' });
        });

        it('Should not get order because some unexpected error occurred', async () => {
            sinon.stub(OrderDAO.prototype, 'findById').throws(new Error('Unexpected error'));

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.orderId}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_RETRIEVING_ORDER' });
        });
    });

    describe('GET /order-number/:orderNumber', () => {
        const baseUrl = '/orders/order-number';

        it('Should get order by order number successfully', async () => {
            sinon.stub(OrderDAO.prototype, 'findByOrderNumber').resolves(Mocks.getOrder());

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.orderNumber}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, order: Mocks.orderOutput });
        });

        it('Should not get order because order was not found', async () => {
            sinon.stub(OrderDAO.prototype, 'findByOrderNumber').resolves(undefined);

            const response = await request(server)
                .get(`${baseUrl}/1000`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'ORDER_NOT_FOUND' });
        });

        it('Should not get order because some unexpected error occurred', async () => {
            sinon.stub(OrderDAO.prototype, 'findByOrderNumber').throws(new Error('Unexpected error'));

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.orderNumber}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_RETRIEVING_ORDER' });
        });
    });

    describe('POST /', () => {
        const route = '/orders';

        it('Should create order successfully', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProduct1());
            sinon.stub(OrderDAO.prototype, 'getCountOfOrders').resolves(1);
            sinon.stub(OrderDAO.prototype, 'findByOrderNumber').resolves(undefined);
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');
            createOrderStub.resolves(Mocks.getOrder());

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, order: Mocks.orderOutput });
            expect(createOrderStub.callCount).equal(1);
        });

        it('Should not create order because user was not found', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns('4b4d4a30-7747-4df7-a484-6905ea5a72e5');
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('User not found'));
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'USER_NOT_FOUND' });
            expect(createOrderStub.callCount).equal(0);
        });

        it('Should not create order because delivery address was not found', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('Address not found'));
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: 'f0e34095-3bc9-4297-af92-eaafb675a1f1',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'ADDRESS_NOT_FOUND' });
            expect(createOrderStub.callCount).equal(0);
        });

        it('Should not create order because product was not found', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('Product not found'));
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: '589917ad-ebfa-4d42-9fde-dc8207c3d3d7', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
            expect(createOrderStub.callCount).equal(0);
        });

        it('Should not create order because product is out of stock', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProductWithoutStock());
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_OUT_OF_STOCK' });
            expect(createOrderStub.callCount).equal(0);
        });

        it('Should not create order because some error happened when managing order items', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProduct1());
            sinon.stub(CalculationUtils, 'calculateOrderTotalValue').throws(new Error('Some error while calculating'));
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_MANAGING_ORDER_ITEMS' });
            expect(createOrderStub.callCount).equal(0);
        });

        it('Should not create order because payment failed', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProduct1());
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '122332323233',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(500); // TODO better http status for payment failed

            expect(response.body).to.deep.equal({ success: false, error: 'PAYMENT_FAILED' });
            expect(createOrderStub.callCount).equal(0);
        });

        it('Should not create order because some error occurred on creating the', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProduct1());
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');
            createOrderStub.throws(new Error('Some error while creating order'));

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_CREATING_ORDER' });
            expect(createOrderStub.callCount).equal(1);
        });

        it('Should not create order because transaction was not successful', async () => {
            sinon.stub(ApiUtils, 'getUserIdFromSession').returns(Mocks.regularUserId);
            sinon.stub(UserDAO.prototype, 'findByIdOrFail').resolves(Mocks.getRegularUser());
            sinon.stub(AddressDAO.prototype, 'findByIdOrFail').resolves(Mocks.deliveryAddress);
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProduct1());
            const createOrderStub = sinon.stub(OrderDAO.prototype, 'createOrderTransaction');
            createOrderStub.resolves(null);

            const response = await request(server)
                .post(`${route}`)
                .send({
                    orderItems: [{ productId: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e', quantity: 1 }],
                    addressId: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
                    shippingCosts: 1000,
                    paymentInfo: {
                        name: 'Vitor Braga',
                        cardNumber: '1111111111111111',
                        expirationDate: '10/2025',
                        securityCode: '123'
                    }
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_CREATING_ORDER' });
            expect(createOrderStub.callCount).equal(1);
        });
    });
});
