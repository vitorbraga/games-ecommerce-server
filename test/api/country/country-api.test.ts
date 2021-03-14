import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import * as Mocks from './mocks';
import logger from '../../../src/utils/logger';
import * as app from '../../../src/app';
import { CountryDAO } from '../../../src/dao/country-dao';
import * as JwtMiddleware from '../../../src/middlewares/checkJwt';
import * as RoleMiddleware from '../../../src/middlewares/checkRole';

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
        const route = '/countries';

        it('Should get all countries successfully', async () => {
            sinon.stub(CountryDAO.prototype, 'findAll').resolves([...Mocks.allCountries]);

            const response = await request(server)
                .get(route)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, countries: [...Mocks.allCountriesOutput] });
        });
    });

    describe('GET /:countryId', () => {
        const baseUrl = '/countries';

        it('Should get desired country successfully', async () => {
            sinon.stub(CountryDAO.prototype, 'findByIdOrFail').resolves(Mocks.country1);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.country1Id}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, country: Mocks.country1Output });
        });

        it('Should not get desired country because of lacking a valid country id', async () => {
            const response = await request(server)
                .get(`${baseUrl}/invalid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_COUNTRY_ID' });
        });

        it('Should not get desired country it was not found', async () => {
            const response = await request(server)
                .get(`${baseUrl}/e60157db-5632-4bab-afbb-17f4c725a744`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'COUNTRY_NOT_FOUND' });
        });
    });

    describe('POST /', () => {
        const route = '/countries';

        it('Should create country successfully', async () => {
            sinon.stub(CountryDAO.prototype, 'save').resolves(Mocks.country3);

            const response = await request(server)
                .post(route)
                .send({
                    name: 'Uruguay'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, country: Mocks.country3Output });
        });

        it('Should not create country because due to lack of country name', async () => {
            const response = await request(server)
                .post(route)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_COUNTRY_NAME' });
        });

        it('Should not create country because due to lack of country name', async () => {
            sinon.stub(CountryDAO.prototype, 'save').throws(new Error('Unexpected error'));
            const response = await request(server)
                .post(route)
                .send({
                    name: 'Uruguay'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_CREATING_COUNTRY' });
        });
    });
});
