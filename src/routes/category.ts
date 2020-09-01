import { Router } from 'express';
import { CategoryController } from '../controllers/category-controller';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';
    
export function getCategoriesRouter(): Router {
    const categoryController = new CategoryController();
    const categoriesRouter = Router();
    
    categoriesRouter.get('/root', categoryController.getRootCategories);
    
    categoriesRouter.get('/', categoryController.getFullTree);
    
    categoriesRouter.get('/parent/:id([0-9]+)', categoryController.getSubCategoriesByParentId);
    
    categoriesRouter.post('/', [checkJwt, checkRole(['ADMIN'])], categoryController.createCategory);

    return categoriesRouter;
}
