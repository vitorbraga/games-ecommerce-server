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
        const parentId = req.params.id;

        let parentCategory: Category | undefined;
        if (parentId !== 'none') {
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

    public deleteSubCategories = async (req: Request, res: Response) => {
        try {
            if (!req.params.parentId) {
                return res.status(422).json({ success: false, error: 'MISSING_CATEGORY_ID' });
            }

            const parentId: string = req.params.parentId;

            const category = await this.categoryDAO.findById(parentId);
            if (!category) {
                return res.status(404).send({ success: false, error: 'CATEGORY_NOT_FOUND' });
            }

            await this.categoryDAO.deleteSubCategoriesCascade(parentId);

            return res.json({ success: true });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_DELETING_PRODUCT' });
        }
    };

    // TODO remove leaf (category without descendant)
    // TOTO merge everything in one method where it will delete a category and all subCategories
}
