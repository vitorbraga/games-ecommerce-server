import * as multer from 'multer';
import * as uuidv4 from 'uuid/v4';

const DIRECTORY = './public/product-pictures';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, DIRECTORY);
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, uuidv4() + '-' + fileName)
    }
});

export const uploadFilterMiddleware = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg formats allowed.'));
        }
    }
});
