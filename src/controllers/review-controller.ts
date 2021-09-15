import { Request, Response } from 'express';
import { ReviewDAO } from '../dao/review-dao';
import { buildReviewOutput } from '../utils/data-filters';
import logger from '../utils/logger';
import * as Validators from '../utils/validators';
import * as ReviewUtils from '../utils/review-utils';

export class ReviewController {
    private reviewDAO: ReviewDAO;

    constructor() {
        this.reviewDAO = new ReviewDAO();
    }

    public getAllReviews = async (req: Request, res: Response) => {
        const reviews = await this.reviewDAO.findAll();
        return res.status(200).send({ success: true, reviews: reviews.map(buildReviewOutput) });
    };

    public getReview = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
                return res.status(422).json({ success: false, error: 'MISSING_REVIEW_ID' });
            }

            const reviewId: string = req.params.id;

            const review = await this.reviewDAO.findByIdOrFail(reviewId);
            return res.json({ success: true, review: buildReviewOutput(review) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'REVIEW_NOT_FOUND' });
        }
    };

    public deleteReview = async (req: Request, res: Response) => {
        try {
            const reviewId: string = req.params.id;

            if (!Validators.validateUuidV4(reviewId)) {
                return res.status(422).json({ success: false, error: 'MISSING_REVIEW_ID' });
            }

            const review = await this.reviewDAO.findById(reviewId);
            if (!review) {
                return res.status(404).send({ success: false, error: 'REVIEW_NOT_FOUND' });
            }

            const product = review.product;
            const remainingReviews = product.reviews.filter((item) => item.id !== reviewId);
            product.rating = ReviewUtils.calculateRating(remainingReviews);

            await this.reviewDAO.removeReviewTransaction(review, product);

            return res.json({ success: true });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_DELETING_REVIEW' });
        }
    };
}
