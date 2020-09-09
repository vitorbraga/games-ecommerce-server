import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PictureDAO } from '../dao/picture-dao';

export class PictureController {
    private pictureDAO: PictureDAO;

    constructor() {
        this.pictureDAO = new PictureDAO();
    }

    public getAllPictures = async (req: Request, res: Response) => {
        const pictures = await this.pictureDAO.findAll()
        return res.status(200).send({ success: true, pictures });
    };

    public getPicture = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PICTURE_ID' });
            }

            const pictureId: string = req.params.id;

            const picture = await this.pictureDAO.findByIdOrFail(pictureId);
            return res.json({ success: true, picture });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'PICTURE_NOT_FOUND' });
        }
    };

    public deletePicture = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PICTURE_ID' });
            }

            const pictureId: string = req.params.id;

            const picture = await this.pictureDAO.findById(pictureId);
            if (!picture) {
                return res.status(404).send({ success: false, error: 'PICTURE_NOT_FOUND' });
            }

            const fileName = picture.filename;
            await this.pictureDAO.delete(pictureId);

            const filePath = path.join(__dirname, '..', '..', 'public', 'product-pictures', fileName);
            fs.unlinkSync(filePath);

            return res.json({ success: true });
        } catch (error) {
            return res.status(500).send({ success: false, error: 'FAILED_DELETING_PICTURE' });
        }
    };
}