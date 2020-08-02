import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { User } from '../entity/User';

export class UserController {
    public static listAll = async (req: Request, res: Response) => {
        // Get users from database
        const userRepository = getRepository(User);
        const users = await userRepository.find({
            select: ['id', 'email', 'role'] // We dont want to send the passwords on response
        });

        // Send the users object
        res.send(users);
    };

    public static getUserById = async (req: Request, res: Response) => {
        if (!req.params.id) {
            res.status(422).json({ success: false, error: 'MISSING_USER_ID' });
        }
        const userId: number = parseInt(req.params.id, 10);

        const userRepository = getRepository(User);

        try {
            const user = await userRepository.findOneOrFail(userId, {
                select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt']
            });
            res.json({ success: true, user });
        } catch (error) {
            res.status(404).send({ success: false, error: 'USER_NOT_FOUND' });
        }
    };

    public static newUser = async (req: Request, res: Response) => {
        // Get parameters from the body
        const { email, password, firstName, lastName } = req.body;
        const user = new User();
        user.email = email;
        user.firstName = firstName;
        user.lastName = lastName;
        user.password = password;
        user.role = 'USER';

        // Validade if the parameters are ok
        const errors: ValidationError[] = await validate(user);
        if (errors.length > 0) {
            const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
            res.status(400).send({ success: false, fields });
            return;
        }

        // Hash the password, to securely store on DB
        user.hashPassword();

        // Try to save. If fails, the username is already in use
        const userRepository = getRepository(User);
        let newUser;
        try {
            newUser = await userRepository.save(user);
        } catch (e) {
            res.status(409).send({ success: false, error: 'REGISTER_EMAIL_IN_USE' });
            return;
        }

        // If all ok, send 201 response
        delete newUser.password;
        res.status(201).send({ success: true, user: newUser });
    };

    public static updateUser = async (req: Request, res: Response) => {
        // Get the ID from the url
        const id = req.params.id;

        const { firstName, lastName } = req.body;

        const userRepository = getRepository(User);
        let user;
        try {
            user = await userRepository.findOneOrFail(id);
        } catch (error) {
            // If not found, send a 404 response
            res.status(404).send({ success: false, error: 'UPDATE_USER_NOT_FOUND' });
            return;
        }

        // Validate the new values on model
        user.firstName = firstName;
        user.lastName = lastName;

        const errors = await validate(user);
        if (errors.length > 0) {
            const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
            res.status(400).send({ success: false, fields });
            return;
        }

        // Try to save, if fails, that means username already in use
        const newUser = await userRepository.save(user);
        delete newUser.password;

        res.status(200).send({ success: true, user: newUser });
    };

    public static deleteUser = async (req: Request, res: Response) => {
        const id = req.params.id;

        const userRepository = getRepository(User);
        try {
            await userRepository.findOneOrFail(id);
        } catch (error) {
            res.status(404).send('User not found');
            return;
        }
        userRepository.delete(id);

        // After all send a 204 (no content, but accepted) response
        res.status(204).send();
    };
}
