import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import * as Mocks from './mocks';
import * as ClassValidator from 'class-validator';
import logger from '../../../src/utils/logger';
import * as app from '../../../src/app';
import * as JwtMiddleware from '../../../src/middlewares/checkJwt';
import * as RoleMiddleware from '../../../src/middlewares/checkRole';
import * as PicturesUploadMiddleware from '../../../src/middlewares/picturesUpload';
import * as ApiUtils from '../../../src/utils/api-utils';
import { ProductDAO } from '../../../src/dao/product-dao';
import { NotFoundError } from '../../../src/errors/not-found-error';
import { CategoryDAO } from '../../../src/dao/category-dao';

describe('Product API', function () {
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
        sinon.stub(PicturesUploadMiddleware, 'uploadFilterMiddleware')
            .callsFake(() => async (req, res, next) => {
                next();
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
        const route = '/products';

        it('Should get all countries successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'findAll').resolves(Mocks.allProducts);

            const response = await request(server)
                .get(route)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, products: Mocks.allProductsOutput });
        });
    });

    describe('GET /:productId', () => {
        const baseUrl = '/products';

        it('Should get product by ID successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').resolves(Mocks.getProduct1());

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.productId1}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, product: Mocks.productOutput1 });
        });

        it('Should not get product because id is not valid', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_ID' });
        });

        it('Should not get product because it was not found', async () => {
            sinon.stub(ProductDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('Product not found'));

            const response = await request(server)
                .get(`${baseUrl}/000d6d4b-e848-4ed3-925c-a27843aff972`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
        });
    });

    describe('POST /', () => {
        const route = '/products';

        it('Should create product successfully', async () => {
            sinon.stub(CategoryDAO.prototype, 'findById').resolves(Mocks.getCategory1());
            sinon.stub(ClassValidator, 'validate').resolves([]);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.resolves(Mocks.getProduct1());

            const response = await request(server)
                .post(`${route}`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, product: Mocks.productOutput1 });
            expect(saveStub.callCount).equal(1);
        });

        it('Should not create product because category was not found', async () => {
            sinon.stub(CategoryDAO.prototype, 'findById').resolves(undefined);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: '3954ad72-281d-4d9b-aabb-dc21c28776a2'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'CATEGORY_NOT_FOUND' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not create product because product info is invalid', async () => {
            sinon.stub(CategoryDAO.prototype, 'findById').resolves(Mocks.getCategory1());
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .post(`${route}`)
                .send({
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(2);
            expect(saveStub.callCount).equal(0);
        });

        it('Should not create product because some error occurred during save', async () => {
            sinon.stub(CategoryDAO.prototype, 'findById').resolves(Mocks.getCategory1());
            sinon.stub(ClassValidator, 'validate').resolves([]);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.throws(new Error('Some error occurred'));

            const response = await request(server)
                .post(`${route}`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: '3954ad72-281d-4d9b-aabb-dc21c28776a2'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_INSERTING_PRODUCT' });
            expect(saveStub.callCount).equal(1);
        });
    });

    describe('PUT /:productId', () => {
        const baseUrl = '/products';

        it('Should update product successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            sinon.stub(ClassValidator, 'validate').resolves([]);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.resolves(Mocks.getProduct1());

            const response = await request(server)
                .put(`${baseUrl}/${Mocks.productId1}`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, product: Mocks.productOutput1 });
            expect(saveStub.callCount).equal(1);
        });

        it('Should not update product because id is invalid', async () => {
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .put(`${baseUrl}/not-a-valid-uuid`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_ID' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not update product because product to be updated was not found', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(undefined);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .put(`${baseUrl}/${Mocks.productId1}`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not update product because data is not valid', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .put(`${baseUrl}/${Mocks.productId1}`)
                .send({
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(422);

            expect(response.body.success).equal(false);
            expect(response.body.fields.length).equal(2);
            expect(saveStub.callCount).equal(0);
        });

        it('Should not update product because some error occurred during save', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            sinon.stub(ClassValidator, 'validate').resolves([]);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.throws(new Error('Error occurred on save'));

            const response = await request(server)
                .put(`${baseUrl}/${Mocks.productId1}`)
                .send({
                    title: 'Product 1',
                    description: 'Product description 1',
                    price: '2000',
                    quantityInStock: 20,
                    tags: 'tags1,tags2',
                    categoryId: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_UPDATING_PRODUCT' });
            expect(saveStub.callCount).equal(1);
        });
    });

    describe('PATCH /:productId/status', () => {
        const baseUrl = '/products';

        it('Should update product status successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.resolves(Mocks.getProduct1());

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.productId1}/status`)
                .send({
                    newStatus: 'AVAILABLE'
                })
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, product: Mocks.productOutput1 });
            expect(saveStub.callCount).equal(1);
        });

        it('Should not update product status because id is invalid', async () => {
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/not-a-valid-uuid/status`)
                .send({
                    newStatus: 'AVAILABLE'
                })
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_ID' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not update product status because newStatus data is invalid', async () => {
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.productId1}/status`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_STATUS_INFORMATION' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not update status because product was not found', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(undefined);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.productId1}/status`)
                .send({
                    newStatus: 'AVAILABLE'
                })
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not update status because some error occurred during save', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.throws(new Error('Some error on save'));

            const response = await request(server)
                .patch(`${baseUrl}/${Mocks.productId1}/status`)
                .send({
                    newStatus: 'AVAILABLE'
                })
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_UPDATING_PRODUCT' });
            expect(saveStub.callCount).equal(1);
        });
    });

    describe('GET /:productId/reviews', () => {
        const baseUrl = '/products';

        it('Should get product reviews successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'getReviewsByProductIdOrFail').resolves([]);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.productId1}/reviews`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, reviews: [] });
        });

        it('Should not get product reviews because product id is invalid', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid/reviews`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_ID' });
        });

        it('Should not get product reviews because product was not found', async () => {
            sinon.stub(ProductDAO.prototype, 'getReviewsByProductIdOrFail').throws(new NotFoundError('Porduct not found'));

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.productId1}/reviews`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
        });
    });

    describe('GET /:productId/pictures', () => {
        const baseUrl = '/products';

        it('Should get product pictures successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'getPicturesByProductIdOrFail').resolves(Mocks.pictures);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.productId1}/pictures`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, pictures: Mocks.picturesOutput });
        });

        it('Should not get product pictures because product id is invalid', async () => {
            const response = await request(server)
                .get(`${baseUrl}/not-a-valid-uuid/pictures`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_ID' });
        });

        it('Should not get product pictures because product was not found', async () => {
            sinon.stub(ProductDAO.prototype, 'getPicturesByProductIdOrFail').throws(new NotFoundError('Product not found'));

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.productId1}/pictures`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
        });
    });

    describe('GET /search', () => {
        const baseUrl = '/products/search';

        it('Should search products successfully with empty search', async () => {
            sinon.stub(ProductDAO.prototype, 'search').resolves(Mocks.allProducts);

            const response = await request(server)
                .get(`${baseUrl}?searchTerm=&categories=&sortTerm=`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, products: Mocks.allProductsOutput });
        });

        it('Should search products successfully with category', async () => {
            sinon.stub(ProductDAO.prototype, 'search').resolves(Mocks.allProducts);

            const response = await request(server)
                .get(`${baseUrl}?searchTerm=&categories=bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1&sortTerm=`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, products: Mocks.allProductsOutput });
        });

        it('Should not search products because some error occurred', async () => {
            sinon.stub(ProductDAO.prototype, 'search').throws(new Error('Some error occurred.'));

            const response = await request(server)
                .get(`${baseUrl}?searchTerm=&categories=&sortTerm=`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_SEARCHING_PRODUCTS' });
        });
    });

    describe('GET /featured', () => {
        const baseUrl = '/products/featured';

        it('Should get featured products successfully', async () => {
            sinon.stub(CategoryDAO.prototype, 'findByKey')
                .onCall(0).resolves(Mocks.getConsolesCategory())
                .onCall(1).resolves(Mocks.getGamesCategory());
            sinon.stub(ProductDAO.prototype, 'search')
                .onCall(0).resolves([])
                .onCall(1).resolves([Mocks.getProduct1()]);

            const response = await request(server)
                .get(baseUrl)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, products: { consoles: [], games: [Mocks.productOutput1] } });
        });

        it('Should get featured products with no consoles', async () => {
            sinon.stub(CategoryDAO.prototype, 'findByKey')
                .onCall(0).resolves(Mocks.getCategory2())
                .onCall(1).resolves(Mocks.getGamesCategory());
            sinon.stub(ProductDAO.prototype, 'search').resolves([Mocks.getProduct1()]);

            const response = await request(server)
                .get(baseUrl)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, products: { consoles: [], games: [Mocks.productOutput1] } });
        });

        it('Should get featured products with no games', async () => {
            sinon.stub(CategoryDAO.prototype, 'findByKey')
                .onCall(0).resolves(Mocks.getConsolesCategory())
                .onCall(1).resolves(Mocks.getCategory1());
            sinon.stub(ProductDAO.prototype, 'search').resolves([Mocks.getProduct1()]);

            const response = await request(server)
                .get(baseUrl)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, products: { consoles: [Mocks.productOutput1], games: [] } });
        });

        it('Should not get featured products because some error occurred', async () => {
            sinon.stub(CategoryDAO.prototype, 'findByKey')
                .onCall(0).resolves(Mocks.getConsolesCategory())
                .onCall(1).resolves(Mocks.getGamesCategory());
            sinon.stub(ProductDAO.prototype, 'search')
                .onCall(0).resolves([])
                .onCall(1).throws(new Error('Some error occurred.'));

            const response = await request(server)
                .get(baseUrl)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_SEARCHING_PRODUCTS' });
        });
    });

    describe('POST /:productId/pictures', () => {
        const baseUrl = '/products';

        it('Should upload pictures successfully', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            sinon.stub(ApiUtils, 'getFilesFromRequest').returns(Mocks.files as Express.MulterS3.File[]);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.resolves(Mocks.getProduct1());

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.productId1}/pictures`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, pictures: [] });
            expect(saveStub.callCount).equal(1);
        });

        it('Should not upload pictures because product id is not valid', async () => {
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/not-a-valid-uuid/pictures`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PRODUCT_ID' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not upload pictures because product was not found', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(undefined);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');

            const response = await request(server)
                .post(`${baseUrl}/41a67740-b124-4cf0-891e-74c861b0c825/pictures`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PRODUCT_NOT_FOUND' });
            expect(saveStub.callCount).equal(0);
        });

        it('Should not upload pictures because some error occurred on save', async () => {
            sinon.stub(ProductDAO.prototype, 'findById').resolves(Mocks.getProduct1());
            sinon.stub(ApiUtils, 'getFilesFromRequest').returns(Mocks.files as Express.MulterS3.File[]);
            const saveStub = sinon.stub(ProductDAO.prototype, 'save');
            saveStub.throws(new Error('Unexpected error'));

            const response = await request(server)
                .post(`${baseUrl}/${Mocks.productId1}/pictures`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_UPLOADING_PICTURES' });
            expect(saveStub.callCount).equal(1);
        });
    });
});
