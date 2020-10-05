import { MigrationInterface, QueryRunner, getRepository } from 'typeorm';
import { User } from '../entity/User';
import { UserRole } from '../entity/model';

export class CreateAdminUser1572462367769 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const user = new User();
        user.email = 'admin@email.com';
        user.password = '123admin';
        user.firstName = 'Vitor';
        user.lastName = 'Admin';
        await user.hashPassword();
        user.role = UserRole.ADMIN;
        const userRepository = getRepository(User);
        await userRepository.save(user);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        console.log('down');
    }
}
