import { expect } from 'chai';
import * as CalculationUtils from '../../src/utils/calculation-utils';
import { getOrder } from './mocks';

describe('Calculation utils', function () {
    describe('calculateOrderItemsTotal', function () {
        it('Should sum the value of the order items correctly', () => {
            const order = getOrder();
            const result = CalculationUtils.calculateOrderItemsTotal(order.orderItems);
            expect(result).equal(208000);
        });
    });

    describe('calculateOrderItemsTotal', function () {
        it('Should calculate the total of the order, including shipping costs', () => {
            const order = getOrder();
            const result = CalculationUtils.calculateOrderTotalValue(order);
            expect(result).equal(209200);
        });
    });
});
