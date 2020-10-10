import { Picture } from '../../../src/entity/Picture';
import { PictureOutput } from '../../../src/utils/data-filters';

export const pictureId1 = '055cbaba-9986-4816-b728-73eef0161468';

export const picture1: Picture = {
    id: pictureId1,
    filename: 'picture1.jpg',
    createdAt: new Date(1602226598184),
    updatedAt: new Date(1602226598184),
    product: null
};

export const pictureOutput1: PictureOutput = {
    id: pictureId1,
    filename: 'picture1.jpg'
};

export const picture2: Picture = {
    id: '14e30156-01fc-4806-9bd1-5446f6814254',
    filename: 'picture2.jpg',
    createdAt: new Date(1602226598184),
    updatedAt: new Date(1602226598184),
    product: null
};

export const pictureOutput2: PictureOutput = {
    id: '14e30156-01fc-4806-9bd1-5446f6814254',
    filename: 'picture2.jpg'
};

export const allPictures: Picture[] = [picture1, picture2];

export const allPicturesOutput: PictureOutput[] = [pictureOutput1, pictureOutput2];
