import * as request from 'supertest';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as http from 'http';
import * as Mocks from './mocks';
import logger from '../../../src/utils/logger';
import * as app from '../../../src/app';
import * as JwtMiddleware from '../../../src/middlewares/checkJwt';
import * as RoleMiddleware from '../../../src/middlewares/checkRole';
import { PictureDAO } from '../../../src/dao/picture-dao';
import { NotFoundError } from '../../../src/errors/not-found-error';
import * as PicturesUtils from '../../../src/utils/pictures-utils';

describe('Picture API', function () {
    let server: http.Server;

    this.beforeAll(async () => {
        // TODO Use a sqlite database for test, configure, etc
        sinon.stub(logger, 'info').returns();
        sinon.stub(JwtMiddleware, 'checkJwt').callsFake((req, res, next): any => next());
        sinon.stub(RoleMiddleware, 'checkRole')
            .callsFake(() => async (req, res, next) => {
                next();
                return undefined;
            });

        server = await app.start();
        Promise.resolve();
    });

    this.beforeEach(() => {
        sinon.stub(logger, 'error').returns();
    });

    this.afterEach(() => {
        sinon.restore();
    });

    this.afterAll(async () => {
        await server.close();
        app.shutdown();
        Promise.resolve();
    });

    describe('GET /', () => {
        const route = '/pictures';

        it('Should get all pictures successfully', async () => {
            sinon.stub(PictureDAO.prototype, 'findAll').resolves([...Mocks.allPictures]);

            const response = await request(server)
                .get(route)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, pictures: [...Mocks.allPicturesOutput] });
        });
    });

    describe('GET /:pictureId', () => {
        const baseUrl = '/pictures';

        it('Should get desired picture successfully', async () => {
            sinon.stub(PictureDAO.prototype, 'findByIdOrFail').resolves(Mocks.picture1);

            const response = await request(server)
                .get(`${baseUrl}/${Mocks.pictureId1}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true, picture: Mocks.pictureOutput1 });
        });

        it('Should not get desired picture because of lacking a valid picture id', async () => {
            const response = await request(server)
                .get(`${baseUrl}/invalid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PICTURE_ID' });
        });

        it('Should not get desired picture because it was not found', async () => {
            sinon.stub(PictureDAO.prototype, 'findByIdOrFail').throws(new NotFoundError('Picture not found'));

            const response = await request(server)
                .get(`${baseUrl}/e60157db-5632-4bab-afbb-17f4c725a744`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PICTURE_NOT_FOUND' });
        });
    });

    describe('DELETE /:pictureId', () => {
        const baseUrl = '/pictures';

        it('Should delete picture successfully', async () => {
            sinon.stub(PictureDAO.prototype, 'findById').resolves(Mocks.picture1);
            const deleteDaoStub = sinon.stub(PictureDAO.prototype, 'delete');
            deleteDaoStub.resolves();
            const removePictureUtilsStub = sinon.stub(PicturesUtils, 'removePicture');
            removePictureUtilsStub.returns();

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.pictureId1}`)
                .expect(200);

            expect(response.body).to.deep.equal({ success: true });
            expect(deleteDaoStub.callCount).equal(1);
            expect(removePictureUtilsStub.callCount).equal(1);
        });

        it('Should not delete picture due to lack of valid picture id', async () => {
            const deleteDaoStub = sinon.stub(PictureDAO.prototype, 'delete');
            const removePictureUtilsStub = sinon.spy(PicturesUtils, 'removePicture');

            const response = await request(server)
                .delete(`${baseUrl}/invalid-uuid`)
                .expect(422);

            expect(response.body).to.deep.equal({ success: false, error: 'MISSING_PICTURE_ID' });
            expect(deleteDaoStub.callCount).equal(0);
            expect(removePictureUtilsStub.callCount).equal(0);
        });

        it('Should not delete picture because it was not found', async () => {
            sinon.stub(PictureDAO.prototype, 'findById').resolves(undefined);
            const deleteDaoStub = sinon.stub(PictureDAO.prototype, 'delete');
            const removePictureUtilsStub = sinon.spy(PicturesUtils, 'removePicture');

            const response = await request(server)
                .delete(`${baseUrl}/e60157db-5632-4bab-afbb-17f4c725a744`)
                .expect(404);

            expect(response.body).to.deep.equal({ success: false, error: 'PICTURE_NOT_FOUND' });
            expect(deleteDaoStub.callCount).equal(0);
            expect(removePictureUtilsStub.callCount).equal(0);
        });

        it('Should not delete picture because something happened on delete', async () => {
            sinon.stub(PictureDAO.prototype, 'findById').resolves(Mocks.picture1);
            const deleteDaoStub = sinon.stub(PictureDAO.prototype, 'delete');
            deleteDaoStub.throws(new Error('Unexpected error'));
            const removePictureUtilsStub = sinon.stub(PicturesUtils, 'removePicture');

            const response = await request(server)
                .delete(`${baseUrl}/${Mocks.pictureId1}`)
                .expect(500);

            expect(response.body).to.deep.equal({ success: false, error: 'FAILED_DELETING_PICTURE' });
            expect(deleteDaoStub.callCount).equal(1);
            expect(removePictureUtilsStub.callCount).equal(0);
        });
    });
});
