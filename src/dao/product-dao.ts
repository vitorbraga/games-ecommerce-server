import { getRepository, Repository } from 'typeorm';
import { Product } from '../entity/Product';
import { NotFoundError } from '../errors/not-found-error';
import { Review } from '../entity/Review';
import { Picture } from '../entity/Picture';
import { ProductStatus, SearchSortType } from '../entity/model';

export class ProductDAO {
    private productRepository: Repository<Product>;

    constructor() {
        this.productRepository = getRepository(Product);
    }

    public async findAll(): Promise<Product[]> {
        const products = await this.productRepository.find();
        return products;
    }

    public async findById(productId: string): Promise<Product | undefined> {
        const product = await this.productRepository.findOne(productId);
        return product;
    }

    public async findByIdOrFail(productId: string): Promise<Product> {
        try {
            const product = await this.productRepository.findOneOrFail(productId);
            return product;
        } catch (error) {
            throw new NotFoundError('Product not found.');
        }
    }

    public async searchWithLike(searchTerm: string, categories: string[], sortType: string): Promise<Product[]> {
        const ilikeTerm = `%${searchTerm}%`;

        let queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.reviews', 'reviews')
            .leftJoinAndSelect('product.pictures', 'pictures')
            .where('(product.title LIKE :title OR product.tags LIKE :tags OR product.description LIKE :description)', { title: ilikeTerm, tags: ilikeTerm, description: ilikeTerm })
            .andWhere('product.status = :status', { status: ProductStatus.AVAILABLE });

        if (categories.length > 0) {
            queryBuilder = queryBuilder.andWhere('category.id IN (:...categories)', { categories });
        }

        if (sortType === SearchSortType.PRICE_LOW_HIGH) {
            queryBuilder = queryBuilder.orderBy('product.price', 'ASC');
        } else if (sortType === SearchSortType.PRICE_HIGH_LOW) {
            queryBuilder = queryBuilder.orderBy('product.price', 'DESC');
        }

        const results = await queryBuilder.getMany();

        return results;
    }

    public async search(searchTerm: string, categories: string[], sortType: string): Promise<Product[]> {
        let queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.reviews', 'reviews')
            .leftJoinAndSelect('product.pictures', 'pictures')
            .select();

        if (searchTerm) {
            queryBuilder = queryBuilder.where('document_with_weights @@ plainto_tsquery(:query)', {
                query: searchTerm
            }).andWhere('product.status = :status', { status: ProductStatus.AVAILABLE }).orderBy(
                'ts_rank(document_with_weights, plainto_tsquery(:query))',
                'DESC'
            );
        }

        if (categories.length > 0) {
            queryBuilder = queryBuilder.andWhere('category.id IN (:...categories)', { categories });
        }

        if (sortType === SearchSortType.PRICE_LOW_HIGH) {
            queryBuilder = queryBuilder.orderBy('product.price', 'ASC');
        } else if (sortType === SearchSortType.PRICE_HIGH_LOW) {
            queryBuilder = queryBuilder.orderBy('product.price', 'DESC');
        }

        const results = await queryBuilder.getMany();

        return results;
    }

    public async save(product: Product): Promise<Product> {
        const savedProduct = await this.productRepository.save(product);
        return savedProduct;
    }

    public async delete(productId: string): Promise<void> {
        await this.productRepository.delete(productId);
    }

    public async getReviewsByProductIdOrFail(productId: string): Promise<Review[]> {
        try {
            const product = await this.productRepository.findOneOrFail(productId);
            return product.reviews;
        } catch (error) {
            throw new NotFoundError('Product not found.');
        }
    }

    public async getPicturesByProductIdOrFail(productId: string): Promise<Picture[]> {
        try {
            const product = await this.productRepository.findOneOrFail(productId);
            return product.pictures;
        } catch (error) {
            throw new NotFoundError('Product not found.');
        }
    }
}
