import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';
import { ProductController } from '../controllers/product-controller';
import { uploadFilterMiddleware } from '../middlewares/picturesUpload';

export function getProductRouter(): Router {
    const productController = new ProductController();
    const productRouter = Router();

    productRouter.get('/search', productController.searchProducts);

    productRouter.get('/featured', productController.getFeaturedProducts);

    productRouter.get('/', [checkJwt, checkRole(['ADMIN'])], productController.getAllProducts);

    productRouter.get('/:id', productController.getProduct);

    productRouter.post('/', [checkJwt, checkRole(['ADMIN'])], productController.createProduct);

    productRouter.put('/:id', [checkJwt, checkRole(['ADMIN'])], productController.updateProduct);

    productRouter.patch('/:id/status', [checkJwt, checkRole(['ADMIN'])], productController.changeProductStatus);

    productRouter.delete('/:id', [checkJwt, checkRole(['ADMIN'])], productController.deleteProduct);

    productRouter.get('/:id/reviews', productController.getProductReviews);

    productRouter.get('/:id/pictures', productController.getProductPictures);

    productRouter.post('/:id/pictures', [checkJwt, checkRole(['ADMIN']), uploadFilterMiddleware.array('pictures', 6)], productController.uploadPictures);

    return productRouter;
}
