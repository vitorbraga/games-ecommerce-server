import { Request, Response } from 'express';
import { getRepository, getManager, IsNull } from 'typeorm';
import { Category } from '../entity/Category';

export class CategoryController {
    public static getFullTree = async (req: Request, res: Response) => {
        const manager = getManager();
        const trees = await manager.getTreeRepository(Category).findTrees();
        
        res.status(200).send({ success: true, categories: trees });
        return;
    };

    public static getRootCategories = async (req: Request, res: Response) => {
        const categoryRepository = getRepository(Category);
        const rootCategories = await categoryRepository.find({ where: { parent: IsNull() }, relations: ['subCategories'] });
        
        res.status(200).send({ success: true, categories: rootCategories });
        return;
    };

    public static getSubCategoriesByParentId = async (req: Request, res: Response) => {
        const parentId = req.params.id || null;
        const categoryRepository = getRepository(Category);

        let parentCategory: Category | undefined;
        if (parentId) {
            parentCategory = await categoryRepository.findOne(parentId);
        }

        const categories = await categoryRepository.find({ where: { parent: parentCategory || null }, relations: ['subCategories'] });
        
        res.status(200).send({ success: true, subCategories: categories });
        return;
    };

    public static createCategory = async (req: Request, res: Response) => {
        const { key, label, parentId } = req.body;

        const categoryRepository = getRepository(Category);
        const category = new Category();
        category.key = key;
        category.label = label;

        if (parentId) {
            const parentCategory = await categoryRepository.findOne(parentId);
            if (parentCategory) {
                category.parent = parentCategory;
            }
        }

        let newCategory;
        try {
            newCategory = await categoryRepository.save(category);
        } catch (e) {
            res.status(500).send({ success: false, error: 'FAILED_INSERTING_CATEGORY' });
            return;
        }

        res.status(200).send({ success: true, category: newCategory });
        return;
    };

    // TODO remove caegory => remove cascade, update parent

    // TODO 
}
