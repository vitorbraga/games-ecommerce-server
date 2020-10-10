import { Address } from '../../../src/entity/Address';
import { Country } from '../../../src/entity/Country';
import { Order } from '../../../src/entity/Order';
import { PasswordReset } from '../../../src/entity/PasswordReset';
import { User } from '../../../src/entity/User';
import { OrderStatus } from '../../../src/entity/model';
import { AddressOutput, CountryOutput, OrderOutput, PasswordResetOutput, UserOutput } from '../../../src/utils/data-filters';

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

export const regularUserOutput: UserOutput = {
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

export function getAdminUser(): User {
    const adminUser = new User();
    adminUser.id = 'ce062fba-c4eb-4fbc-8832-39dfbfa010a0';
    adminUser.firstName = 'Admin';
    adminUser.lastName = 'User';
    adminUser.email = 'admin@email.com';
    adminUser.password = 'hasgdvyasd89hgiuvhdasu8y9a';
    adminUser.addresses = [];
    adminUser.mainAddress = null;
    adminUser.orders = [];
    adminUser.role = 'ADMIN';
    adminUser.passwordResets = [];
    adminUser.createdAt = new Date(1602226598184);
    adminUser.updatedAt = new Date(1602226598184);

    return adminUser;
};

export const adminUserOutput: UserOutput = {
    id: 'ce062fba-c4eb-4fbc-8832-39dfbfa010a0',
    email: 'admin@email.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    mainAddress: null,
    addresses: [],
    passwordResets: [],
    orders: [],
    createdAt: 1602226598184,
    updatedAt: 1602226598184
};

export const allUsers = [getRegularUser(), getAdminUser()];
export const allUsersOutput = [regularUserOutput, adminUserOutput];

export const passwordReset: PasswordReset = {
    id: '42088568-6119-47c3-bb57-f78f4405fa0b',
    token: '2ae63575-4402-454d-a002-5061ae5e15bf',
    createdAt: new Date(1602226598184),
    updatedAt: new Date(1602226598184),
    user: null
};

export const userPasswordResets = [passwordReset];

export const passwordResetOutput: PasswordResetOutput = {
    id: '42088568-6119-47c3-bb57-f78f4405fa0b',
    token: '2ae63575-4402-454d-a002-5061ae5e15bf',
    createdAt: 1602226598184,
    updatedAt: 1602226598184
};

export const userPasswordResetsOutput = [passwordResetOutput];

export function getNewRegularUser(): User {
    const regularUser = new User();
    regularUser.id = '37746c2c-9800-420e-af23-efb658b89e82';
    regularUser.firstName = 'Jon';
    regularUser.lastName = 'Doe';
    regularUser.email = 'jon.doe@email.com';
    regularUser.password = '1tfg8x23dgvasbdq9dgsyiuhb1';
    regularUser.addresses = [];
    regularUser.mainAddress = null;
    regularUser.orders = [];
    regularUser.role = 'USER';
    regularUser.passwordResets = [];
    regularUser.createdAt = new Date(1602226598184);
    regularUser.updatedAt = new Date(1602226598184);

    return regularUser;
};

export const newRegularUserOutput: UserOutput = {
    id: '37746c2c-9800-420e-af23-efb658b89e82',
    email: 'jon.doe@email.com',
    firstName: 'Jon',
    lastName: 'Doe',
    role: 'USER',
    mainAddress: null,
    addresses: [],
    passwordResets: [],
    orders: [],
    createdAt: 1602226598184,
    updatedAt: 1602226598184
};

export const countryId = '11cd04b9-8350-447e-8fbe-cf6e90fa2f40';

export const country: Country = {
    id: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
    name: 'Netherlands',
    addresses: []
};

export const countryOutput: CountryOutput = {
    id: '11cd04b9-8350-447e-8fbe-cf6e90fa2f40',
    name: 'Netherlands'
};

export const addressId = '87ec3ad0-092f-422f-814c-507ba8bc7af8';

export const address: Address = {
    id: addressId,
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

export const addressOutput: AddressOutput = {
    id: addressId,
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

export function getRegularUserWithMainAddress(): User {
    const regularUser = new User();
    regularUser.id = regularUserId;
    regularUser.firstName = 'Vitor';
    regularUser.lastName = 'Braga';
    regularUser.email = 'vitor@email.com';
    regularUser.password = 'sad8gfasdydsa8gyuvbhasdua';
    regularUser.addresses = [];
    regularUser.mainAddress = address;
    regularUser.orders = [];
    regularUser.role = 'USER';
    regularUser.passwordResets = [];
    regularUser.createdAt = new Date(1602226598184);
    regularUser.updatedAt = new Date(1602226598184);

    return regularUser;
};

export function getRegularUserWithAddresses(): User {
    const regularUser = new User();
    regularUser.id = regularUserId;
    regularUser.firstName = 'Vitor';
    regularUser.lastName = 'Braga';
    regularUser.email = 'vitor@email.com';
    regularUser.password = 'sad8gfasdydsa8gyuvbhasdua';
    regularUser.mainAddress = address;
    regularUser.orders = [];
    regularUser.role = 'USER';
    regularUser.passwordResets = [];
    regularUser.createdAt = new Date(1602226598184);
    regularUser.updatedAt = new Date(1602226598184);
    regularUser.addresses = [address];

    return regularUser;
};

export const order: Order = {
    id: 'f3b1de5e-a9be-4ffb-ace5-16cbc436bc74',
    status: OrderStatus.AWAITING_PAYMENT,
    user: getRegularUser(),
    total: 1000,
    shippingCosts: 10,
    deliveryAddress: address,
    orderNumber: '123',
    orderItems: [],
    createdAt: new Date(1602226598184),
    updatedAt: new Date(1602226598184)
};

export const orderOutput: OrderOutput = {
    id: 'f3b1de5e-a9be-4ffb-ace5-16cbc436bc74',
    status: OrderStatus.AWAITING_PAYMENT,
    coupon: null,
    total: 1000,
    shippingCosts: 10,
    deliveryAddress: addressOutput,
    orderNumber: '123',
    orderItems: [],
    createdAt: 1602226598184,
    updatedAt: 1602226598184,
    user: regularUserOutput
};
