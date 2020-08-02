import { MigrationInterface, QueryRunner, getRepository } from 'typeorm';
import { User } from '../entity/User';

export class CreateAdminUser1572462367769 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const user = new User();
        user.email = 'admin@email.com';
        user.password = 'admin';
        user.firstName = 'Vitor';
        user.lastName = 'Admin';
        user.hashPassword();
        user.role = 'ADMIN';
        const userRepository = getRepository(User);
        await userRepository.save(user);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        console.log('down');
    }
}
