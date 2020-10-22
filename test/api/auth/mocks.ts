import { PasswordReset } from '../../../src/entities/PasswordReset';
import { User } from '../../../src/entities/User';

export const regularUserId = '693ecd5a-c8d9-4648-9e32-f200db2831d8';

export function getRegularUser(): User {
    const regularUser = new User();
    regularUser.id = regularUserId;
    regularUser.firstName = 'Vitor';
    regularUser.lastName = 'Braga';
    regularUser.email = 'vitor@email.com';
    regularUser.password = 'password123';
    regularUser.addresses = [];
    regularUser.mainAddress = null;
    regularUser.orders = [];
    regularUser.role = 'USER';
    regularUser.passwordResets = [];
    regularUser.createdAt = new Date(1602226598184);
    regularUser.updatedAt = new Date(1602226598184);

    return regularUser;
};

export function getAdminUser(): User {
    const adminUser = new User();
    adminUser.id = 'ce062fba-c4eb-4fbc-8832-39dfbfa010a0';
    adminUser.firstName = 'Admin';
    adminUser.lastName = 'User';
    adminUser.email = 'admin@email.com';
    adminUser.password = 'password123';
    adminUser.addresses = [];
    adminUser.mainAddress = null;
    adminUser.orders = [];
    adminUser.role = 'ADMIN';
    adminUser.passwordResets = [];
    adminUser.createdAt = new Date(1602226598184);
    adminUser.updatedAt = new Date(1602226598184);

    return adminUser;
};

export const createdAt = 1602226598184;

export const passwordReset: PasswordReset = {
    id: '052c01cf-a1eb-4351-90ed-410043e8f3c0',
    token: 'cac57697-a8a7-4ae5-ae08-bf11000a8cb9',
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    user: getRegularUser()
};

export const passwordRecoveryToken = '5a4e1281-886b-4fe8-9b78-600caac1a86f';

export const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
