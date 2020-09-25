import { Request, Response } from 'express';
import { Category } from '../entity/Category';
import { CategoryDAO } from '../dao/category-dao';
import { buildCategoryOutput } from '../utils/data-filters';
import logger from '../utils/logger';

export class CategoryController {
    private categoryDAO: CategoryDAO;

    constructor() {
        this.categoryDAO = new CategoryDAO();
    }

    public getFullTree = async (req: Request, res: Response) => {
        const trees = await this.categoryDAO.getFullTree();
        return res.status(200).send({ success: true, categories: trees.map(buildCategoryOutput) });
    };

    public getRootCategories = async (req: Request, res: Response) => {
        const rootCategories = await this.categoryDAO.getRootCategories();
        return res.status(200).send({ success: true, categories: rootCategories.map(buildCategoryOutput) });
    };

    public getSubCategoriesByParentId = async (req: Request, res: Response) => {
        const parentId = req.params.id || null;

        let parentCategory: Category | undefined;
        if (parentId) {
            parentCategory = await this.categoryDAO.findById(parentId);
        }

        const categories = await this.categoryDAO.getSubCategoriesFromParent(parentCategory || null);
        return res.status(200).send({ success: true, subCategories: categories.map(buildCategoryOutput) });
    };

    public createCategory = async (req: Request, res: Response) => {
        const { key, label, parentId } = req.body;

        const category = new Category();
        category.key = key;
        category.label = label;

        if (parentId) {
            const parentCategory = await this.categoryDAO.findById(parentId);
            if (parentCategory) {
                category.parent = parentCategory;
            }
        }

        let newCategory;
        try {
            newCategory = await this.categoryDAO.save(category);
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_INSERTING_CATEGORY' });
        }

        return res.status(200).send({ success: true, category: buildCategoryOutput(newCategory) });
    };

    // TODO remove category => remove cascade, update parent
}
