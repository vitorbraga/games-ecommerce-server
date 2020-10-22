import { getManager, getRepository, Repository } from 'typeorm';
import { Address } from '../entities/Address';
import { User } from '../entities/User';
import { NotFoundError } from '../errors/not-found-error';

export class AddressDAO {
    private addressRepository: Repository<Address>;

    constructor() {
        this.addressRepository = getRepository(Address);
    }

    public async findAll(): Promise<Address[]> {
        const addresses = await this.addressRepository.find();
        return addresses;
    }

    public async findById(addressId: string): Promise<Address | undefined> {
        const address = await this.addressRepository.findOne(addressId);
        return address;
    }

    public async findByIdOrFail(addressId: string): Promise<Address> {
        try {
            const address = await this.addressRepository.findOneOrFail(addressId);
            return address;
        } catch (error) {
            throw new NotFoundError('Address not found.');
        }
    }

    public async delete(addressId: string): Promise<void> {
        await this.addressRepository.delete(addressId);
    }

    public async deleteUserAddressTransaction(addressId: string, user: User): Promise<User | undefined> {
        let updatedUser: User | undefined;
        await getManager().transaction(async (transactionalEntityManager) => {
            updatedUser = await transactionalEntityManager.save(user);
            await transactionalEntityManager.delete(Address, addressId);
        });

        return updatedUser;
    }
}
