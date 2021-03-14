import { User } from '../../src/entities/User';

export const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyU2Vzc2lvbiI6eyJpZCI6IjY5M2VjZDVhLW'
    + 'M4ZDktNDY0OC05ZTMyLWYyMDBkYjI4MzFkOCIsImZpcnN0TmFtZSI6IlZpdG9yIn0sImlhdCI6MTYwMzM3NzMxMSwiZXhwIjoyNDY3Mzc3MzExfQ.eX_9PDGrN7FiLs4HkVsWPGmGaSk-Mf7T6yMA7M60XC4';

export const invalidJwtToken = 'ciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyU2Vzc2lvbiI6eyJpZCI6IjY5M2VjZDVhLW'
+ 'M4ZDktNDY0OC05ZTMyLWYyMDBkYjI4MzFkOCIsImZpcnN0TmFtZSI6IlZpdG9yIn0sImlhdCI6MTYwMzM3NzMxMSwiZXhwIjoyNDY3Mzc3MzExfQ.eX_9PDGrN7FiLs4HkVsWPGmGaSk-Mf7T6yMA7M60XC4';

export const validAuthorizationHeader = `Bearer ${validJwtToken}`;

export const invalidauthorizationHeader = `${validJwtToken}`;

export const validHeaders = {
    authorization: validAuthorizationHeader
};

export const invalidHeaders = {
    authorization: invalidauthorizationHeader
};

export const validLocals = {
    jwtPayload: {
        exp: 2467377311,
        iat: 1603377311,
        userSession: {
            firstName: 'Vitor',
            id: '693ecd5a-c8d9-4648-9e32-f200db2831d8'
        }
    }
};

export const invalidLocals = {
    jwtPayload: {
        exp: 1603226077,
        iat: 1603218877,
        userSession: {
            firstName: 'Vitor',
            id: 'a7066157-a5bd-4271-86e1-fe43290c08fd'
        }
    }
};

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
