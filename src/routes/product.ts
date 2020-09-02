import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';
import { ProductController } from '../controllers/product-controller';
    
export function getProductRouter(): Router {
    const productController = new ProductController();
    const productRouter = Router();
    
    productRouter.get('/', productController.getAllProducts);

    productRouter.get('/:id', productController.getProduct);
    
    productRouter.post('/', [checkJwt, checkRole(['ADMIN'])], productController.createProduct);

    productRouter.put('/:id', [checkJwt, checkRole(['ADMIN'])], productController.updateProduct);

    productRouter.delete('/:id', [checkJwt, checkRole(['ADMIN'])], productController.deleteProduct);

    return productRouter;
}
