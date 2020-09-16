import { Repository, getRepository } from 'typeorm';
import { User } from '../entity/User';
import { NotFoundError } from '../errors/not-found-error';
import { PasswordReset } from '../entity/PasswordReset';

export class UserDAO {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = getRepository(User);
    }

    public async list(): Promise<User[]> {
        const users = await this.userRepository.find({
            select: ['id', 'email', 'role'] // We dont want to send the passwords on response
        });

        return users;
    }

    public async findByIdOrFail(userId: string, relations?: string[]): Promise<User> {
        try {
            const user = await this.userRepository.findOneOrFail(userId, { relations });

            return user;
        } catch (error) {
            throw new NotFoundError('User not found.');
        }
    }

    public async findById(userId: string, relations?: string[]): Promise<User | undefined> {
        const user = await this.userRepository.findOne(userId, { relations });
        return user;
    }

    public async getPasswordResetsByUserIdOrFail(userId: string): Promise<PasswordReset[]> {
        try {
            const result = await this.userRepository.findOneOrFail(userId, { relations: ['passwordResets'] });
            return result.passwordResets;
        } catch (error) {
            throw new NotFoundError('User not found.');
        }
    }

    public async save(user: User): Promise<User> {
        const savedUser = await this.userRepository.save(user);
        return savedUser;
    }

    public async deleteById(userId: string) {
        await this.userRepository.delete(userId);
    }

    public async findByEmail(email: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne({ where: { email } });
        return user;
    }

    public async findByEmailOrFail(email: string): Promise<User> {
        try {
            const user = await this.userRepository.findOneOrFail({ where: { email } });
            return user;
        } catch (error) {
            throw new NotFoundError('User not found');
        }
    }
}
