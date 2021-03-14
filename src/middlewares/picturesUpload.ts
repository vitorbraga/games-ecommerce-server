import * as multer from 'multer';
import * as uuidv4 from 'uuid/v4';
import * as multerS3 from 'multer-s3';
import s3 from '../utils/aws-s3';

const maxFileSize = 5 * 1024 * 1024; // 5MB

const storage = multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME || 'games-ecommerce-dev',
    metadata: (_, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, `product-pictures/${uuidv4()}-${fileName}`);
    }
});

export const uploadFilterMiddleware = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, callback) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            callback(null, true);
        } else {
            callback(null, false);
            return callback(new Error('Only .png, .jpg and .jpeg formats allowed.'));
        }
    }
});
