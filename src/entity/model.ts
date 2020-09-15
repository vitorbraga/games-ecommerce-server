export enum ProductStatus {
    AVAILABLE = 'AVAILABLE',
    NOT_AVAILABLE = 'NOT_AVAILABLE'
};

export enum UserProductStatus {
    AWAITING_PAYMENT = 'AWAITING_PAYMENT',
    AWAITING_DELIVERY = 'AWAITING_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export enum SearchSortType {
    NONE = 'NONE',
    PRICE_LOW_HIGH = 'PRICE_LOW_HIGH',
    PRICE_HIGH_LOW = 'PRICE_HIGH_LOW'
}
