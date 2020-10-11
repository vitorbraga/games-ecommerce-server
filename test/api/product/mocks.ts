import { Category } from '../../../src/entity/Category';
import { ProductStatus } from '../../../src/entity/model';
import { Picture } from '../../../src/entity/Picture';
import { Product } from '../../../src/entity/Product';
import { CategoryOutput, PictureOutput, ProductOutput } from '../../../src/utils/data-filters';

export const productId1 = 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e';

export function getCategory1(): Category {
    const category1 = new Category();
    category1.id = 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1';
    category1.key = 'games-ps4';
    category1.label = 'Games PS4';
    category1.subCategories = [];

    return category1;
}

export function getProduct1(): Product {
    const product1 = new Product();
    product1.id = productId1;
    product1.title = 'Product 1';
    product1.description = 'Product 1 description';
    product1.rating = 0;
    product1.orderItems = [];
    product1.status = ProductStatus.AVAILABLE;
    product1.tags = 'tag1,tag2';
    product1.createdAt = new Date(1602226598184);
    product1.updatedAt = new Date(1602226598184);
    product1.pictures = [];
    product1.price = 12000;
    product1.quantityInStock = 20;
    product1.category = getCategory1();

    return product1;
}

const categoryOutput1: CategoryOutput = {
    id: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1',
    key: 'games-ps4',
    label: 'Games PS4',
    subCategories: []
};

export const productOutput1: ProductOutput = {
    id: productId1,
    title: 'Product 1',
    description: 'Product 1 description',
    rating: 0,
    status: ProductStatus.AVAILABLE,
    tags: 'tag1,tag2',
    createdAt: 1602226598184,
    updatedAt: 1602226598184,
    pictures: [],
    reviews: [],
    discount: null,
    quantityInStock: 20,
    price: 12000,
    category: categoryOutput1
};

export function getCategory2() {
    const category = new Category();
    category.id = '26342db8-9257-4f14-b8f7-460c20103092';
    category.key = 'consoles-ps4';
    category.label = 'Consoles PS4';
    category.subCategories = [];

    return category;
}

export function getProduct2(): Product {
    const product2 = new Product();
    product2.id = '53a02fac-8f4b-4e49-8570-a8d30c96792a';
    product2.title = 'Product 2';
    product2.description = 'Product 2 description';
    product2.rating = 0;
    product2.orderItems = [];
    product2.status = ProductStatus.AVAILABLE;
    product2.tags = 'tag1,tag2';
    product2.createdAt = new Date(1602226598184);
    product2.updatedAt = new Date(1602226598184);
    product2.pictures = [];
    product2.price = 12000;
    product2.quantityInStock = 20;
    product2.category = getCategory2();

    return product2;
}

const categoryOutput2: CategoryOutput = {
    id: '26342db8-9257-4f14-b8f7-460c20103092',
    key: 'consoles-ps4',
    label: 'Consoles PS4',
    subCategories: []
};

export const productOutput2: ProductOutput = {
    id: '53a02fac-8f4b-4e49-8570-a8d30c96792a',
    title: 'Product 2',
    description: 'Product 2 description',
    rating: 0,
    status: ProductStatus.AVAILABLE,
    tags: 'tag1,tag2',
    createdAt: 1602226598184,
    updatedAt: 1602226598184,
    pictures: [],
    reviews: [],
    discount: null,
    quantityInStock: 20,
    price: 12000,
    category: categoryOutput2
};

export const allProducts = [getProduct1(), getProduct2()];
export const allProductsOutput = [productOutput1, productOutput2];

export const pictures: Picture[] = [
    {
        id: '492e747b-0c35-45d0-9c83-133014344260',
        filename: 'product-picture-1.jpg',
        product: getProduct1(),
        createdAt: new Date(1602226598184),
        updatedAt: new Date(1602226598184)
    }
];

export const picturesOutput: PictureOutput[] = [
    {
        id: '492e747b-0c35-45d0-9c83-133014344260',
        filename: 'product-picture-1.jpg'
    }
];

export function getConsolesCategory(): Category {
    const category1 = new Category();
    category1.id = 'd696ce52-6011-4a33-8b00-67dc93d819f5';
    category1.key = 'consoles';
    category1.label = 'Consoles';
    category1.subCategories = [getCategory2()];

    return category1;
}

export function getGamesCategory(): Category {
    const category1 = new Category();
    category1.id = 'be62f608-fae5-4883-82fe-0c83d9a0d815';
    category1.key = 'games';
    category1.label = 'Games';
    category1.subCategories = [getCategory1()];

    return category1;
}

export const files = [{ key: 'picture1.jpg' }];
