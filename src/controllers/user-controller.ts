import { Request, Response } from 'express';
import { validate, ValidationError } from 'class-validator';
import { User } from '../entity/User';
import { UserRole } from '../entity/model';
import { UserDAO } from '../dao/user-dao';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest } from '../utils/api-utils';
import { buildAddressOutput, buildOrderOutput, buildUserOutput } from '../utils/data-filters';
import { Address } from '../entity/Address';
import { validationErrorsToErrorFields } from '../utils/validators';
import { AddressDAO } from '../dao/address-dao';
import { CountryDAO } from '../dao/country-dao';
import logger from '../utils/logger';
import { OrderDAO } from '../dao/order-dao';

interface UpdateUserBody {
    firstName: string;
    lastName: string;
}

interface CreateUserBody {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

interface CreateAddressBody {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    zipCode: string;
    countryId: string;
    info: string;
    mainAddress: boolean;
}

export class UserController {
    private userDAO: UserDAO;
    private addressDAO: AddressDAO;
    private countryDAO: CountryDAO;
    private orderDAO: OrderDAO;

    constructor() {
        this.userDAO = new UserDAO();
        this.addressDAO = new AddressDAO();
        this.countryDAO = new CountryDAO();
        this.orderDAO = new OrderDAO();
    }

    public listAll = async (req: Request, res: Response) => {
        const users = await this.userDAO.list();
        return res.send({ success: true, users: users.map(buildUserOutput) });
    };

    public getUserById = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const user = await this.userDAO.findByIdOrFail(userId);

            return res.json({ success: true, user: buildUserOutput(user) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    };

    public getUserFullDataById = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const user = await this.userDAO.findByIdOrFail(userId, ['mainAddress', 'addresses', 'passwordResets']);

            return res.json({ success: true, user: buildUserOutput(user) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    };

    public getUserPasswordResets = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const passwordResets = await this.userDAO.getPasswordResetsByUserIdOrFail(userId);
            return res.json({ success: true, passwordResets });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    };

    private buildUserFromBody({ email, firstName, lastName, password }: CreateUserBody): User {
        const user = new User();
        user.email = email;
        user.firstName = firstName;
        user.lastName = lastName;
        user.password = password;
        user.role = UserRole.USER;

        return user;
    }

    public createUser = async (req: CustomRequest<CreateUserBody>, res: Response) => {
        try {
            const user = this.buildUserFromBody(req.body);

            const errors: ValidationError[] = await validate(user);
            if (errors.length > 0) {
                const fields = validationErrorsToErrorFields(errors);
                return res.status(400).send({ success: false, fields });
            }

            if (await this.userDAO.findByEmail(user.email)) {
                return res.status(409).send({ success: false, error: 'REGISTER_EMAIL_IN_USE' });
            }

            // Hash the password, to securely store on DB
            await user.hashPassword();
            const newUser = await this.userDAO.save(user);

            return res.status(201).send({ success: true, user: buildUserOutput(newUser) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'CREATE_USER_FAILED' });
        }
    };

    public updateUser = async (req: CustomRequest<UpdateUserBody>, res: Response) => {
        try {
            const id = req.params.id;
            const { firstName, lastName } = req.body;

            const user = await this.userDAO.findByIdOrFail(id);

            user.firstName = firstName;
            user.lastName = lastName;

            const errors = await validate(user);
            if (errors.length > 0) {
                const fields = validationErrorsToErrorFields(errors);
                return res.status(400).send({ success: false, fields });
            }

            const updatedUser = await this.userDAO.save(user);

            return res.status(200).send({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'UPDATE_USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'UPDATE_USER_FAILED' });
            }
        }
    };

    public deleteUser = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;

            await this.userDAO.findByIdOrFail(id);

            await this.userDAO.deleteById(id);

            // After all send a 204 (no content, but accepted) response
            return res.status(204).send();
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'DELETE_USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'DELETE_USER_FAILED' });
            }
        }
    };

    private buildAddressFromBody(createAddressBody: CreateAddressBody): Address {
        const address = new Address();
        address.fullName = createAddressBody.fullName;
        address.line1 = createAddressBody.line1;
        address.line2 = createAddressBody.line2;
        address.city = createAddressBody.city;
        address.zipCode = createAddressBody.zipCode;
        address.info = createAddressBody.info;

        return address;
    }

    public getUserAddresses = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const user = await this.userDAO.findByIdOrFail(userId, ['addresses']);
            return res.json({ success: true, addresses: user.addresses.map(buildAddressOutput) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'FETCHING_USER_ADDRESSES_FAILED' });
            }
        }
    };

    public createAddress = async (req: CustomRequest<CreateAddressBody>, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            if (!req.body.countryId) {
                return res.status(422).json({ success: false, error: 'MISSING_COUNTRY_ID' });
            }

            const userId: string = req.params.id;

            const user = await this.userDAO.findByIdOrFail(userId, ['addresses']);

            const address = this.buildAddressFromBody(req.body);

            const country = await this.countryDAO.findById(req.body.countryId);
            if (!country) {
                return res.status(404).send({ success: false, error: 'COUNTRY_NOT_FOUND' });
            }
            address.country = country;

            const errors = await validate(address);
            if (errors.length > 0) {
                const fields = validationErrorsToErrorFields(errors);
                return res.status(400).send({ success: false, fields });
            }

            if (req.body.mainAddress) {
                user.mainAddress = address;
            }

            user.addresses = user.addresses ? [...user.addresses, address] : [address];

            const updatedUser = await this.userDAO.save(user);

            return res.json({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'FAILED_CREATING_ADDRESS' });
            }
        }
    };

    public setMainAddress = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const addressId = req.params.addressId;

            if (!userId) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            if (!addressId) {
                return res.status(422).json({ success: false, error: 'MISSING_ADDRESS_ID' });
            }

            const user = await this.userDAO.findById(userId);
            if (!user) {
                return res.status(422).json({ success: false, error: 'USER_NOT_FOUND' });
            }

            const address = await this.addressDAO.findById(addressId);
            if (!address) {
                return res.status(422).json({ success: false, error: 'ADDRESS_NOT_FOUND' });
            }

            user.mainAddress = address;

            const updatedUser = await this.userDAO.save(user);

            return res.status(200).send({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'SET_MAIN_ADDRESS_FAILED' });
        }
    };

    public deleteUserAddress = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const addressId = req.params.addressId;

            if (!userId) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            if (!addressId) {
                return res.status(422).json({ success: false, error: 'MISSING_ADDRESS_ID' });
            }

            const user = await this.userDAO.findById(userId);
            if (!user) {
                return res.status(422).json({ success: false, error: 'USER_NOT_FOUND' });
            }

            const address = await this.addressDAO.findById(addressId);
            if (!address) {
                return res.status(422).json({ success: false, error: 'ADDRESS_NOT_FOUND' });
            }

            if (user.mainAddress && user.mainAddress.id === addressId) {
                user.mainAddress = null;
            }

            const updatedUser = await this.userDAO.save(user);

            await this.addressDAO.delete(addressId);

            return res.status(200).send({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'DELETE_ADDRESS_FAILED' });
        }
    };

    public getUserOrders = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const orders = await this.orderDAO.getOrdersByUser(userId);
            return res.json({ success: true, orders: orders.map(buildOrderOutput) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'FETCHING_USER_ORDERS_FAILED' });
            }
        }
    };
}
