import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import logger from '../../../src/utils/logger';
import * as app from '../../../src/app';
import * as JwtMiddleware from '../../../src/middlewares/checkJwt';
import * as RoleMiddleware from '../../../src/middlewares/checkRole';
import { UserDAO } from '../../../src/dao/user-dao';
import { OrderDAO } from '../../../src/dao/order-dao';

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
    });

    describe('GET /', () => {
        const route = '/overview';

        it('Should get overview successfully', async () => {
            sinon.stub(UserDAO.prototype, 'findAll').resolves([]);
            sinon.stub(OrderDAO.prototype, 'findAll').resolves([]);

            const response = await request(server)
                .get(route)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, overview: { users: 0, orders: 0 } });
        });

        it('Should not get overview because some error occurred', async () => {
            sinon.stub(UserDAO.prototype, 'findAll').throws(new Error('Some error occurred'));

            const response = await request(server)
                .get(route)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'GETTING_OVERVIEW_FAILED' });
        });
    });
});
