import { getRepository, Repository, getManager, IsNull } from 'typeorm';
import { NotFoundError } from '../errors/not-found-error';
import { Category } from '../entity/Category';

export class CategoryDAO {
    private categoryRepository: Repository<Category>;

    constructor() {
        this.categoryRepository = getRepository(Category);
    }

    public async getFullTree(): Promise<Category[]> {
        const manager = getManager();
        const trees = await manager.getTreeRepository(Category).findTrees();

        return trees;
    };

    public async getRootCategories(): Promise<Category[]> {
        const rootCategories = await this.categoryRepository.find({ where: { parent: IsNull() }, relations: ['subCategories'] });
        return rootCategories;
    };

    public async getSubCategoriesFromParent(parent: Category | null): Promise<Category[]> {
        const categories = await this.categoryRepository.find({ where: { parent }, relations: ['subCategories'] });
        return categories;
    }

    public async findById(categoryId: string): Promise<Category | undefined> {
        const category = await this.categoryRepository.findOne(categoryId);
        return category;
    }

    public async findByIdOrFail(categoryId: string): Promise<Category> {
        try {
            const category = await this.categoryRepository.findOneOrFail(categoryId);
            return category;
        } catch (error) {
            throw new NotFoundError('Category not found.');
        }
    }

    public async save(category: Category): Promise<Category> {
        const savedCategory = await this.categoryRepository.save(category);
        return savedCategory;
    }
}
