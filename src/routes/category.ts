import { Router } from 'express';
import { CategoryController } from '../controllers/category-controller';

export const categoriesRouter = Router();

export interface CreateCategoryBody {
    key: string;
    label: string;
    parentId?: number;
}

categoriesRouter.get('/root', CategoryController.getRootCategories);

categoriesRouter.get('/', CategoryController.getFullTree);

categoriesRouter.get('/parent/:id([0-9]+)', CategoryController.getSubCategoriesByParentId);

// FIXME checkRole(['ADMIN'])]
categoriesRouter.post('/', CategoryController.createCategory);

