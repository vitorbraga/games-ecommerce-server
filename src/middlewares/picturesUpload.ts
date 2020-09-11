import * as multer from 'multer';
import * as uuidv4 from 'uuid/v4';

const directory = './public/product-pictures';
const maxFileSize = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, directory);
    },
    filename: (req, file, callback) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        callback(null, `${uuidv4()}-${fileName}`);
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
