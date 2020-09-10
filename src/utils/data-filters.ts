import { Product } from '../entity/Product';
import { Category } from '../entity/Category';
import { Review } from '../entity/Review';
import { Picture } from '../entity/Picture';

export interface ProductOutput {
    id: number;
    title: string;
    description: string;
    discount: number | null;
    quantityInStock: number;
    tags: string;
    status: string;
    price: number;
    rating: number;
    category: CategoryOutput;
    reviews: ReviewOutput[];
    pictures: PictureOutput[];
}

export interface CategoryOutput {
    id: number;
    key: string;
    label: string;
}

export interface ReviewOutput {
    id: number;
    title: string;
    description: string;
    rating: number;
}

export interface PictureOutput {
    id: number;
    filename: string;
}

export function buildProductOutput(product: Product): ProductOutput {
    return {
        id: product.id,
        title: product.title,
        description: product.description,
        quantityInStock: product.quantityInStock,
        discount: product.discount,
        tags: product.tags,
        status: product.status,
        price: product.price,
        rating: product.rating,
        category: buildCategoryOutput(product.category),
        reviews: product.reviews.map(buildReviewOutput),
        pictures: product.pictures.map(buildPictureOutput)
    }
}

export function buildCategoryOutput(category: Category): CategoryOutput {
    return {
        id: category.id,
        key: category.key,
        label: category.label
    }
}

export function buildReviewOutput(review: Review): ReviewOutput {
    return {
        id: review.id,
        title: review.title,
        description: review.description,
        rating: review.rating
    }
}

export function buildPictureOutput(picture: Picture): PictureOutput {
    return {
        id: picture.id,
        filename: picture.filename
    }
}

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}
