import { getManager, getRepository, Repository } from 'typeorm';
import { Product } from '../entities/Product';
import { Review } from '../entities/Review';
import { NotFoundError } from '../errors/not-found-error';

export class ReviewDAO {
    private reviewRepository: Repository<Review>;

    constructor() {
        this.reviewRepository = getRepository(Review);
    }

    public async findAll(): Promise<Review[]> {
        const reviews = await this.reviewRepository.find();
        return reviews;
    }

    public async findById(reviewId: string): Promise<Review | undefined> {
        const review = await this.reviewRepository.findOne(reviewId, { relations: ['user', 'product'] });
        return review;
    }

    public async findByIdOrFail(reviewId: string): Promise<Review> {
        try {
            const review = await this.reviewRepository.findOneOrFail(reviewId);
            return review;
        } catch (error) {
            throw new NotFoundError('Review not found.');
        }
    }

    public async delete(reviewId: string): Promise<void> {
        await this.reviewRepository.delete(reviewId);
    }

    public async removeReviewTransaction(review: Review, product: Product): Promise<void> {
        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.remove(review);
            await transactionalEntityManager.save(product);
        });
    }

    public async getReviewsByUser(userId: string): Promise<Review[]> {
        const reviews = await this.reviewRepository.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, relations: ['product'] });
        return reviews;
    }
}
