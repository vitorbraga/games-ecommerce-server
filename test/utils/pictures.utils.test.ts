import { expect } from 'chai';
import * as sinon from 'sinon';
import s3 from '../../src/utils/aws-s3';
import logger from '../../src/utils/logger';
import * as PicturesUtils from '../../src/utils/pictures-utils';

describe('Pictures Utils', function () {
    const originalBucketName = process.env.S3_BUCKET_NAME;

    this.beforeEach(async () => {
        sinon.stub(logger, 'error').returns();
        sinon.stub(logger, 'info').returns();
    });

    this.afterEach(async () => {
        sinon.restore();
        process.env.S3_BUCKET_NAME = originalBucketName;
    });

    describe('removePicture', function () {
        it('Remove picture function called with process.env.S3_BUCKET_NAME', () => {
            const deleteObjectStub = sinon.stub(s3, 'deleteObject');
            deleteObjectStub.returns({} as any);
            PicturesUtils.removePicture('filename.jpg');

            const calledWithParams = deleteObjectStub.getCall(0).args[0];

            expect(calledWithParams).to.deep.equal({ Bucket: process.env.S3_BUCKET_NAME, Key: 'filename.jpg' });
        });

        it('Remove picture function called with games-ecommerce-dev', () => {
            delete process.env.S3_BUCKET_NAME;
            const deleteObjectStub = sinon.stub(s3, 'deleteObject');
            deleteObjectStub.returns({} as any);
            PicturesUtils.removePicture('filename.jpg');

            const calledWithParams = deleteObjectStub.getCall(0).args[0];

            expect(calledWithParams).to.deep.equal({ Bucket: 'games-ecommerce-dev', Key: 'filename.jpg' });
        });
    });
});
