import { Request, Response } from 'express';
import { validate, ValidationError } from 'class-validator';
import { User } from '../entity/User';
import { UserRole } from '../entity/model';
import { UserDAO } from '../dao/user-dao';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest } from '../utils/api-utils';

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

export class UserController {
    private userDAO: UserDAO;

    constructor() {
        this.userDAO = new UserDAO();
    }

    public listAll= async (req: Request, res: Response) => {
        const users = await this.userDAO.list();
        return res.send(users);
    }

    public getUserById = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const user = await this.userDAO.findByIdOrFail(userId);
            return res.json({ success: true, user });
        } catch (error) {
            res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    }

    public getUserPasswordResets = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
            }

            const userId: string = req.params.id;

            const passwordResets = await this.userDAO.getPasswordResetsByUserIdOrFail(userId);
            return res.json({ success: true, passwordResets });
        } catch (error) {
            res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    }

    private buildUserFromBody({ email, firstName, lastName, password }: CreateUserBody) {
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
                const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
                return res.status(400).send({ success: false, fields });
            }
    
            if (await this.userDAO.findByEmail(user.email)) {
                return res.status(409).send({ success: false, error: 'REGISTER_EMAIL_IN_USE' });
            }

            // Hash the password, to securely store on DB
            await user.hashPassword();
            const newUser = await this.userDAO.save(user);

            delete newUser.password;
            
            return res.status(201).send({ success: true, user: newUser });
        } catch (e) {
            return res.status(500).send({ success: false, error: 'CREATE_USER_FAILED' });
        }
    }

    public updateUser = async (req: CustomRequest<UpdateUserBody>, res: Response) => {
        try {
            const id = req.params.id;
            const { firstName, lastName } = req.body;
    
            const user = await this.userDAO.findByIdOrFail(id);

            user.firstName = firstName;
            user.lastName = lastName;

            const errors = await validate(user);
            if (errors.length > 0) {
                const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
                return res.status(400).send({ success: false, fields });
            }

            const updatedUser = await this.userDAO.save(user);

            delete updatedUser.password;

            return res.status(200).send({ success: true, user: updatedUser });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'UPDATE_USER_NOT_FOUND' });
            } else {
                return res.status(500).send({ success: false, error: 'UPDATE_USER_FAILED' });
            }
        }
    }

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
                return res.status(500).send({ success: false, error: 'DELETE_USER_FAILED' });
            }
        }
    }
}
