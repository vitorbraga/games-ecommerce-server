import { Product } from '../entity/Product';
import { Category } from '../entity/Category';
import { Review } from '../entity/Review';
import { Picture } from '../entity/Picture';
import { User } from '../entity/User';

export interface ProductOutput {
    id: string;
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
    id: string;
    key: string;
    label: string;
    subCategories: CategoryOutput[];
}

export interface ReviewOutput {
    id: string;
    title: string;
    description: string;
    rating: number;
}

export interface PictureOutput {
    id: string;
    filename: string;
}

export interface UserOutput {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: number;
    updatedAt: number;
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
        reviews: product.reviews ? product.reviews.map(buildReviewOutput) : [],
        pictures: product.pictures ? product.pictures.map(buildPictureOutput) : []
    };
}

export function buildCategoryOutput(category: Category): CategoryOutput {
    return {
        id: category.id,
        key: category.key,
        label: category.label,
        subCategories: category.subCategories ? category.subCategories.map(buildCategoryOutput) : []
    };
}

export function buildReviewOutput(review: Review): ReviewOutput {
    return {
        id: review.id,
        title: review.title,
        description: review.description,
        rating: review.rating
    };
}

export function buildPictureOutput(picture: Picture): PictureOutput {
    return {
        id: picture.id,
        filename: picture.filename
    };
}

export function buildUserOutput(user: User): UserOutput {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.createdAt.getTime()
    };
}

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined && x !== null;
}
