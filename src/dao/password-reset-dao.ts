import { getRepository, Repository } from 'typeorm';
import { NotFoundError } from '../errors/not-found-error';
import { PasswordReset } from '../entity/PasswordReset';

export class PasswordResetDAO {
    private passwordResetRepository: Repository<PasswordReset>;

    constructor() {
        this.passwordResetRepository = getRepository(PasswordReset);
    }

    public async findByTokenOrFail(token: string): Promise<PasswordReset> {
        try {
            const passwordReset = await this.passwordResetRepository.findOneOrFail({ where: { token }, relations: ['user'] });
            return passwordReset;
        } catch (error) {
            throw new NotFoundError('PasswordReset not found');
        }
    }

    public async findActivePasswordRecoveriesFromUser(userId: string, limitDate: number): Promise<PasswordReset[]> {
        const recoveries = await this.passwordResetRepository
            .createQueryBuilder('passwordReset')
            .select('passwordReset.id')
            .andWhere('userId = :userId')
            .andWhere('createdAt > :limitDate')
            .setParameters({ userId, limitDate: new Date(limitDate) })
            .getMany();
        return recoveries;
    }
}
