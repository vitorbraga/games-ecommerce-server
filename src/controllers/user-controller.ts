import { Request, Response } from 'express';
import { validate, ValidationError } from 'class-validator';
import { User } from '../entities/User';
import { UserRole } from '../entities/model';
import { UserDAO } from '../dao/user-dao';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest } from '../utils/api-utils';
import { buildAddressOutput, buildOrderOutput, buildPasswordResetOutput, buildUserOutput } from '../utils/data-filters';
import { Address } from '../entities/Address';
import { validationErrorsToErrorFields } from '../utils/validators';
import { AddressDAO } from '../dao/address-dao';
import { CountryDAO } from '../dao/country-dao';
import logger from '../utils/logger';
import { OrderDAO } from '../dao/order-dao';
import * as Validators from '../utils/validators';

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
        const users = await this.userDAO.findAll();
        return res.send({ success: true, users: users.map(buildUserOutput) });
    };

    public getUserById = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.userId;

            const user = await this.userDAO.findByIdOrFail(userId);

            return res.json({ success: true, user: buildUserOutput(user) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    };

    public getUserFullDataById = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.userId;

            const user = await this.userDAO.findByIdOrFail(userId, ['mainAddress', 'addresses', 'passwordResets', 'orders']);

            return res.json({ success: true, user: buildUserOutput(user) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    };

    public getUserPasswordResets = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.userId;

            const passwordResets = await this.userDAO.getPasswordResetsByUserIdOrFail(userId);

            return res.json({ success: true, passwordResets: passwordResets.map(buildPasswordResetOutput) });
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
                return res.status(422).send({ success: false, fields });
            }

            if (!Validators.validatePasswordComplexity(user.password)) {
                return res.status(422).send({ success: false, error: 'REGISTER_PASSWORD_COMPLEXITY' });
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

    public changePassword = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId = req.params.userId;

            const { currentPassword, newPassword } = req.body;
            if (!(currentPassword && newPassword)) {
                return res.status(422).send({ success: false, error: 'CHANGE_PASSWORD_MISSING_DATA' });
            }

            if (!Validators.validatePasswordComplexity(newPassword)) {
                return res.status(422).send({ success: false, error: 'CHANGE_PASSWORD_COMPLEXITY' });
            }

            const user = await this.userDAO.findByIdOrFail(userId);

            if (!await user.checkIfUnencryptedPasswordIsValid(currentPassword)) {
                return res.status(401).send({ success: false, error: 'CHANGE_PASSWORD_INCORRECT_CURRENT_PASSWORD' });
            }

            user.password = newPassword;
            await user.hashPassword();
            const updatedUser = await this.userDAO.save(user);

            return res.status(200).send({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CHANGE_PASSWORD_USER_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'CHANGE_PASSWORD_FAILED' });
            }
        }
    };

    public updateUser = async (req: CustomRequest<UpdateUserBody>, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId = req.params.userId;
            const { firstName, lastName } = req.body;

            if (!(firstName && lastName)) {
                return res.status(422).json({ success: false, error: 'UPDATE_USER_MISSING_DATA' });
            }

            const user = await this.userDAO.findByIdOrFail(userId);

            user.firstName = firstName;
            user.lastName = lastName;
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
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId = req.params.userId;

            if (!await this.userDAO.findById(userId)) {
                return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
            }

            await this.userDAO.deleteById(userId);

            return res.status(200).send({ success: true });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'DELETE_USER_FAILED' });
        }
    };

    public getUserAddresses = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.userId;

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

    public createAddress = async (req: CustomRequest<CreateAddressBody>, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            if (!Validators.validateUuidV4(req.body.countryId)) {
                return res.status(422).json({ success: false, error: 'MISSING_COUNTRY_ID' });
            }

            const userId: string = req.params.userId;

            const user = await this.userDAO.findById(userId, ['addresses']);
            if (!user) {
                return res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
            }

            const address = this.buildAddressFromBody(req.body);

            const country = await this.countryDAO.findById(req.body.countryId);
            if (!country) {
                return res.status(404).send({ success: false, error: 'COUNTRY_NOT_FOUND' });
            }
            address.country = country;

            const errors = await validate(address);
            if (errors.length > 0) {
                const fields = validationErrorsToErrorFields(errors);
                return res.status(422).send({ success: false, fields });
            }

            if (req.body.mainAddress) {
                user.mainAddress = address;
            }

            user.addresses = user.addresses ? [...user.addresses, address] : [address];

            const updatedUser = await this.userDAO.save(user);

            return res.json({ success: true, user: buildUserOutput(updatedUser) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_CREATING_ADDRESS' });
        }
    };

    public setMainAddress = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId;
            const addressId = req.params.addressId;

            if (!Validators.validateUuidV4(userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            if (!Validators.validateUuidV4(addressId)) {
                return res.status(422).json({ success: false, error: 'MISSING_ADDRESS_ID' });
            }

            const user = await this.userDAO.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
            }

            const address = await this.addressDAO.findById(addressId);
            if (!address) {
                return res.status(404).json({ success: false, error: 'ADDRESS_NOT_FOUND' });
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

            if (!Validators.validateUuidV4(userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            if (!Validators.validateUuidV4(addressId)) {
                return res.status(422).json({ success: false, error: 'MISSING_ADDRESS_ID' });
            }

            const user = await this.userDAO.findById(userId, ['mainAddress']);
            if (!user) {
                return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
            }

            const address = await this.addressDAO.findById(addressId);
            if (!address) {
                return res.status(404).json({ success: false, error: 'ADDRESS_NOT_FOUND' });
            }

            if (user.mainAddress && user.mainAddress.id === addressId) {
                user.mainAddress = null;
            }

            const result = await this.addressDAO.deleteUserAddressTransaction(addressId, user);

            return res.status(200).send({ success: true, user: buildUserOutput(result || user) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'DELETE_ADDRESS_FAILED' });
        }
    };

    public getUserOrders = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.userId)) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.userId;
            if (!await this.userDAO.findById(userId)) {
                return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
            }

            const orders = await this.orderDAO.getOrdersByUser(userId);

            return res.json({ success: true, orders: orders.map(buildOrderOutput) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FETCHING_USER_ORDERS_FAILED' });
        }
    };
}
