import { getRepository, Repository } from 'typeorm';
import { Picture } from '../entities/Picture';
import { NotFoundError } from '../errors/not-found-error';

export class PictureDAO {
    private pictureRepository: Repository<Picture>;

    constructor() {
        this.pictureRepository = getRepository(Picture);
    }

    public async findAll(): Promise<Picture[]> {
        const pictures = await this.pictureRepository.find();
        return pictures;
    }

    public async findById(pictureId: string): Promise<Picture | undefined> {
        const picture = await this.pictureRepository.findOne(pictureId);
        return picture;
    }

    public async findByIdOrFail(pictureId: string): Promise<Picture> {
        try {
            const picture = await this.pictureRepository.findOneOrFail(pictureId);
            return picture;
        } catch (error) {
            throw new NotFoundError('Picture not found.');
        }
    }

    public async delete(pictureId: string): Promise<void> {
        await this.pictureRepository.delete(pictureId);
    }
}
