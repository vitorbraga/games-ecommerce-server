import { Review } from '../entities/Review';

export function calculateRating(reviews: Review[]): number {
    return reviews.reduce((prev, cur) => prev + cur.rating, 0) / reviews.length;
}
