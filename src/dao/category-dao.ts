import { getRepository, Repository, getManager, IsNull, getConnection, QueryRunner } from 'typeorm';
import { NotFoundError } from '../errors/not-found-error';
import { Category } from '../entities/Category';

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

    public async findByKey(categoryKey: string): Promise<Category | undefined> {
        const category = await this.categoryRepository.findOne({ where: { key: categoryKey }, relations: ['subCategories'] });
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

    public async delete(categoryId: string): Promise<void> {
        await this.categoryRepository.delete(categoryId);
    }

    public async deleteSubCategoriesCascade(parentId: string): Promise<void> {
        // TODO
        // let ids = descendants where ancestor = 2
        // delete rows from the closure table where descendant in ids
        // set parent key to null where the parent key in ids
        // delete rows from the entity table where id in ids
        const category = await this.categoryRepository.findOneOrFail(parentId, { relations: ['subCategories'] });

        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        await this.deleteChildrenAndSelf(category, queryRunner);

        await queryRunner.commitTransaction();
        await queryRunner.release();
    }

    private async deleteChildrenAndSelf(category: Category, queryRunner: QueryRunner) {
        const descendantIds = category.subCategories ? category.subCategories.map((item) => item.id) : [];

        if (descendantIds.length > 0) {
            for (const id of descendantIds) {
                const category = await this.categoryRepository.findOneOrFail(id, { relations: ['subCategories'] });
                await this.deleteChildrenAndSelf(category, queryRunner);
            }

            const descendants = `'${descendantIds.join("','")}'`;
            await queryRunner.query(
                `DELETE FROM "category_closure" WHERE id_descendant IN (${descendants});`
            );

            await queryRunner.query(
                `UPDATE "category" SET "parentId" = NULL WHERE "parentId" IN (${descendants});`
            );

            await queryRunner.query(
                `UPDATE "product" SET "categoryId" = NULL WHERE "categoryId" IN (${descendants});`
            );

            await queryRunner.query(
                `DELETE FROM "category" WHERE id IN (${descendants});`
            );
        }
    }
}
