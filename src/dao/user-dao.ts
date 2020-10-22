import { Repository, getRepository } from 'typeorm';
import { User } from '../entities/User';
import { NotFoundError } from '../errors/not-found-error';
import { PasswordReset } from '../entities/PasswordReset';
import { Order } from '../entities/Order';

export class UserDAO {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = getRepository(User);
    }

    public async findAll(): Promise<User[]> {
        const users = await this.userRepository.find();

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

    public async getOrdersByUserIdOrFail(userId: string): Promise<Order[]> {
        const result = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.orders', 'orders')
            .where('user.id = :userId')
            .orderBy('order.createdAt', 'DESC')
            .setParameters({ userId })
            .getOne();
        if (!result) {
            throw new NotFoundError('User not found.');
        }

        return result.orders;
    }
}
