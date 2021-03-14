import { Address } from '../../../src/entities/Address';
import { Category } from '../../../src/entities/Category';
import { Country } from '../../../src/entities/Country';
import { OrderStatus, ProductStatus } from '../../../src/entities/model';
import { Order } from '../../../src/entities/Order';
import { OrderItem } from '../../../src/entities/OrderItem';
import { Product } from '../../../src/entities/Product';
import { User } from '../../../src/entities/User';
import { AddressOutput, CategoryOutput, CountryOutput, OrderOutput, ProductOutput, UserOutput } from '../../../src/utils/data-filters';

export const orderId = '63863de1-eb2a-4b1e-bdf0-29241f91fe50';
export const orderNumber = '1234';
export const regularUserId = '693ecd5a-c8d9-4648-9e32-f200db2831d8';

export function getRegularUser(): User {
    const regularUser = new User();
    regularUser.id = regularUserId;
    regularUser.firstName = 'Vitor';
    regularUser.lastName = 'Braga';
    regularUser.email = 'vitor@email.com';
    regularUser.password = 'sad8gfasdydsa8gyuvbhasdua';
    regularUser.addresses = [];
    regularUser.mainAddress = null;
    regularUser.orders = [];
    regularUser.role = 'USER';
    regularUser.passwordResets = [];
    regularUser.createdAt = new Date(1602226598184);
    regularUser.updatedAt = new Date(1602226598184);

    return regularUser;
};

const regularUserOutput: UserOutput = {
    id: regularUserId,
    email: 'vitor@email.com',
    firstName: 'Vitor',
    lastName: 'Braga',
    role: 'USER',
    mainAddress: null,
    addresses: [],
    passwordResets: [],
    orders: [],
    createdAt: 1602226598184,
    updatedAt: 1602226598184
};

const country: Country = {
    id: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
    name: 'Netherlands',
    addresses: []
};

export function getProduct1(): Product {
    const category = new Category();
    category.id = 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1';
    category.key = 'games-ps4';
    category.label = 'Games PS4';
    category.subCategories = [];

    const product1 = new Product();
    product1.id = 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e';
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
    product1.category = category;

    return product1;
}

export function getProductWithoutStock(): Product {
    const category = new Category();
    category.id = 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1';
    category.key = 'games-ps4';
    category.label = 'Games PS4';
    category.subCategories = [];

    const product1 = new Product();
    product1.id = 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e';
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
    product1.quantityInStock = 0;
    product1.category = category;

    return product1;
}

export const deliveryAddress: Address = {
    id: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
    fullName: 'Vitor Braga',
    line1: 'Address line 1',
    line2: 'Address line 2',
    city: 'Amsterdam',
    zipCode: '1234 NH',
    country,
    info: 'information',
    createdAt: new Date(1602226598184),
    updatedAt: new Date(1602226598184),
    orders: [],
    user: null
};

export function getOrder(): Order {
    const order = new Order();
    order.id = orderId;
    order.shippingCosts = 1000;
    order.status = OrderStatus.AWAITING_PAYMENT;
    order.total = 13000;
    order.orderNumber = orderNumber;
    order.createdAt = new Date(1602226598184);
    order.updatedAt = new Date(1602226598184);
    order.user = getRegularUser();

    order.deliveryAddress = deliveryAddress;

    const orderItem1 = new OrderItem();
    orderItem1.id = '6c07e6c1-50d0-4bd2-b3a2-1d818b87d9ab';
    orderItem1.product = getProduct1();
    orderItem1.quantity = 1;

    order.orderItems = [orderItem1];

    return order;
}

const categoryOutput: CategoryOutput = {
    id: 'bb8867fd-e9f0-47d5-b98f-7a4d07a2fcf1',
    key: 'games-ps4',
    label: 'Games PS4',
    subCategories: []
};

const productOutput: ProductOutput = {
    id: 'e2f4be6b-ea8b-4a52-b1f8-843b32ddb55e',
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
    category: categoryOutput
};

const countryOutput: CountryOutput = {
    id: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
    name: 'Netherlands'
};

const addressOutput: AddressOutput = {
    id: '87ec3ad0-092f-422f-814c-507ba8bc7af8',
    fullName: 'Vitor Braga',
    line1: 'Address line 1',
    line2: 'Address line 2',
    city: 'Amsterdam',
    zipCode: '1234 NH',
    country: countryOutput,
    info: 'information',
    createdAt: 1602226598184,
    updatedAt: 1602226598184
};

export const orderOutput: OrderOutput = {
    id: orderId,
    coupon: null,
    user: regularUserOutput,
    orderItems: [
        {
            id: '6c07e6c1-50d0-4bd2-b3a2-1d818b87d9ab',
            product: productOutput,
            quantity: 1
        }
    ],
    shippingCosts: 1000,
    deliveryAddress: addressOutput,
    status: OrderStatus.AWAITING_PAYMENT,
    total: 13000,
    orderNumber,
    createdAt: 1602226598184,
    updatedAt: 1602226598184
};
