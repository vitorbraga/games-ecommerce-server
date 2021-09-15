import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';
import { ReviewController } from '../controllers/review-controller';

export function getReviewRouter(): Router {
    const reviewController = new ReviewController();
    const reviewRouter = Router();

    reviewRouter.get('/', reviewController.getAllReviews);

    reviewRouter.get('/:id', reviewController.getReview);

    reviewRouter.delete('/:id', [checkJwt, checkRole(['USER'])], reviewController.deleteReview);

    return reviewRouter;
}
