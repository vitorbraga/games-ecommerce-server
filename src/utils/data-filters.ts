import { Product } from '../entity/Product';
import { Category } from '../entity/Category';
import { Review } from '../entity/Review';
import { Picture } from '../entity/Picture';
import { User } from '../entity/User';
import { Address } from '../entity/Address';
import { Country } from '../entity/Country';
import { PasswordReset } from '../entity/PasswordReset';
import { Order } from '../entity/Order';
import { OrderItem } from '../entity/OrderItem';

// FIXME separate this, improve it (naming, place, where to put - rethink it)

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

export interface CountryOutput {
    id: string;
    name: string;
}

export interface UserOutput {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    mainAddress: AddressOutput | null;
    addresses: AddressOutput[];
    passwordResets: PasswordResetOutput[];
    createdAt: number;
    updatedAt: number;
}

export interface UserSessionOutput {
    id: string;
    firstName: string;
}

export interface AddressOutput {
    id: string;
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    zipCode: string;
    country: CountryOutput;
    info: string;
    createdAt: number;
    updatedAt: number;
}

export interface PasswordResetOutput {
    id: string;
    token: string;
    createdAt: number;
    updatedAt: number;
}

export interface OrderItemOutput {
    id: string;
    quantity: number;
    product: ProductOutput;
}

export interface OrderOutput {
    id: string;
    status: string;
    orderNumber: string;
    shippingCosts: number;
    total: number;
    coupon: string | null;
    orderItems: OrderItemOutput[];
    deliveryAddress: AddressOutput;
    user: UserOutput;
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

export function buildPasswordResetOutput(passwordReset: PasswordReset): PasswordResetOutput {
    return {
        id: passwordReset.id,
        token: passwordReset.token,
        createdAt: passwordReset.createdAt.getTime(),
        updatedAt: passwordReset.createdAt.getTime()
    };
}

export function buildPictureOutput(picture: Picture): PictureOutput {
    return {
        id: picture.id,
        filename: picture.filename
    };
}

export function buildCountryOutput(country: Country): CountryOutput {
    return {
        id: country.id,
        name: country.name
    };
}

export function buildUserOutput(user: User): UserOutput {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mainAddress: user.mainAddress ? buildAddressOutput(user.mainAddress) : null,
        addresses: user.addresses ? user.addresses.map(buildAddressOutput) : [],
        passwordResets: user.passwordResets ? user.passwordResets.map(buildPasswordResetOutput) : [],
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime()
    };
}

export function buildUserSession(user: User): UserSessionOutput {
    return {
        id: user.id,
        firstName: user.firstName
    };
}

export function buildAddressOutput(address: Address): AddressOutput {
    return {
        id: address.id,
        fullName: address.fullName,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        zipCode: address.zipCode,
        country: buildCountryOutput(address.country),
        info: address.info,
        createdAt: address.createdAt.getTime(),
        updatedAt: address.updatedAt.getTime()
    };
}

export function buildOrderItemOutput(orderItem: OrderItem): OrderItemOutput {
    return {
        id: orderItem.id,
        quantity: orderItem.quantity,
        product: buildProductOutput(orderItem.product)
    };
}

export function buildOrderOutput(order: Order): OrderOutput {
    return {
        id: order.id,
        status: order.status,
        shippingCosts: order.shippingCosts,
        total: order.total,
        coupon: order.coupon,
        orderNumber: order.orderNumber,
        deliveryAddress: buildAddressOutput(order.deliveryAddress),
        orderItems: order.orderItems.map(buildOrderItemOutput),
        user: buildUserOutput(order.user),
        createdAt: order.createdAt.getTime(),
        updatedAt: order.updatedAt.getTime()
    };
}

export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined && x !== null;
}
