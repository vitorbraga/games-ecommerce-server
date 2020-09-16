import { getRepository, Repository } from 'typeorm';
import { Country } from '../entity/Country';
import { NotFoundError } from '../errors/not-found-error';

export class CountryDAO {
    private countryRepository: Repository<Country>;

    constructor() {
        this.countryRepository = getRepository(Country);
    }

    public async save(country: Country): Promise<Country> {
        const savedCountry = await this.countryRepository.save(country);
        return savedCountry;
    }

    public async findAll(): Promise<Country[]> {
        const countryes = await this.countryRepository.find({ order: { name: 'ASC' } });
        return countryes;
    }

    public async findById(countryId: string): Promise<Country | undefined> {
        const country = await this.countryRepository.findOne(countryId);
        return country;
    }

    public async findByIdOrFail(countryId: string): Promise<Country> {
        try {
            const country = await this.countryRepository.findOneOrFail(countryId);
            return country;
        } catch (error) {
            throw new NotFoundError('Country not found.');
        }
    }

    public async delete(countryId: string): Promise<void> {
        await this.countryRepository.delete(countryId);
    }
}
