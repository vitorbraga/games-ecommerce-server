import s3 from './aws-s3';
import logger from './logger';

export function removePicture(fileName: string) {
    const bucketName = process.env.S3_BUCKET_NAME || 'games-ecommerce-dev';
    const params = { Bucket: bucketName, Key: fileName };

    s3.deleteObject(params, (err, data) => {
        if (err) {
            logger.error('Error deleting picture from S3', err.stack);
        } else {
            logger.info('Picture deleted from S3', fileName);
        }
    });
}
