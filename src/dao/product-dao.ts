import { getRepository, Repository } from 'typeorm';
import { Product } from '../entity/Product';
import { NotFoundError } from '../errors/not-found-error';
import { Review } from '../entity/Review';
import { Picture } from '../entity/Picture';

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