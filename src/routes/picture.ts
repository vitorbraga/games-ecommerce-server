import { Router } from 'express';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';
import { PictureController } from '../controllers/picture-controller';

export function getPictureRouter(): Router {
    const pictureController = new PictureController();
    const pictureRouter = Router();

    pictureRouter.get('/', pictureController.getAllPictures);

    pictureRouter.get('/:id', pictureController.getPicture);

    pictureRouter.delete('/:id', [checkJwt, checkRole(['ADMIN'])], pictureController.deletePicture);

    return pictureRouter;
}
