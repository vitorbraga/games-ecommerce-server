import { validate, ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { CategoryDAO } from '../dao/category-dao';
import { ProductDAO } from '../dao/product-dao';
import { ProductStatus } from '../entity/model';
import { Picture } from '../entity/Picture';
import { Product } from '../entity/Product';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest } from '../utils/api-utils';
import { buildProductOutput, buildReviewOutput, buildPictureOutput } from '../utils/data-filters';
import logger from '../utils/logger';

interface CreateProductBody {
    title: string;
    description: string;
    price: string;
    quantityInStock: number;
    tags: string;
    categoryId: string;
}

interface UpdateProductBody {
    title: string;
    description: string;
    price: string;
    quantityInStock: number;
    tags: string;
    categoryId: string;
}

interface ChangeProductStatusBody {
    newStatus: ProductStatus;
}

export class ProductController {
    private productDAO: ProductDAO;
    private categoryDAO: CategoryDAO;

    constructor() {
        this.productDAO = new ProductDAO();
        this.categoryDAO = new CategoryDAO();
    }

    public getAllProducts = async (req: Request, res: Response) => {
        const products = await this.productDAO.findAll();
        return res.status(200).send({ success: true, products: products.map(buildProductOutput) });
    };

    public searchProducts = async (req: Request, res: Response) => {
        try {
            const searchTerm = req.query.searchTerm as string;
            const categories = req.query.categories as string;
            const sortType = req.query.sortType as string;

            const categoriesArray = categories ? categories.split(',') : [];
            const products = await this.productDAO.search(searchTerm, categoriesArray, sortType);

            return res.json({ success: true, products: products.map(buildProductOutput) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_SEARCHING_PRODUCTS' });
        }
    };

    public getFeaturedProducts = async (req: Request, res: Response) => {
        try {
            const products = await this.productDAO.search('', [], 'none');
            return res.json({ success: true, products: products.slice(0, 4).map(buildProductOutput) });
            // TODO implement this logic to get featured products for the homepage
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_SEARCHING_PRODUCTS' });
        }
    };

    public getProduct = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findByIdOrFail(productId);
            return res.json({ success: true, product: buildProductOutput(product) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
        }
    };

    private async buildProductFromBody(body: CreateProductBody | UpdateProductBody): Promise<Product> {
        const product = new Product();
        product.title = body.title;
        product.description = body.description;
        product.price = parseInt(body.price, 10); // TODO check this
        product.quantityInStock = body.quantityInStock;
        product.tags = body.tags;
        product.rating = 0;

        const category = await this.categoryDAO.findByIdOrFail(body.categoryId);
        product.category = category;

        return product;
    }

    public createProduct = async (req: CustomRequest<CreateProductBody>, res: Response) => {
        try {
            const product = await this.buildProductFromBody(req.body);

            const errors: ValidationError[] = await validate(product);
            if (errors.length > 0) {
                const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
                return res.status(400).send({ success: false, fields });
            }

            product.status = ProductStatus.NOT_AVAILABLE;

            const newProduct = await this.productDAO.save(product);
            return res.status(200).send({ success: true, product: buildProductOutput(newProduct) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CATEGORY_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'FAILED_INSERTING_PRODUCT' });
            }
        }
    };

    public updateProduct = async (req: CustomRequest<UpdateProductBody>, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findById(productId);
            if (!product) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            }

            const productFromBody = await this.buildProductFromBody(req.body);

            const errors: ValidationError[] = await validate(productFromBody);
            if (errors.length > 0) {
                const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
                return res.status(400).send({ success: false, fields });
            }

            const updatedProduct = await this.productDAO.save({ ...product, ...productFromBody });
            return res.json({ success: true, product: buildProductOutput(updatedProduct) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CATEGORY_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'FAILED_UPDATING_PRODUCT' });
            }
        }
    };

    public changeProductStatus = async (req: CustomRequest<ChangeProductStatusBody>, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            if (!req.body || !req.body.newStatus) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_STATUS_INFORMATION' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findById(productId);
            if (!product) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            }

            const { newStatus } = req.body;

            const updatedProduct = await this.productDAO.save({ ...product, status: newStatus });
            return res.json({ success: true, product: buildProductOutput(updatedProduct) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_UPDATING_PRODUCT' });
        }
    };

    public deleteProduct = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findById(productId);
            if (!product) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            }

            await this.productDAO.delete(productId);

            return res.json({ success: true });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_DELETING_PRODUCT' });
        }
    };

    public getProductReviews = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const reviews = await this.productDAO.getReviewsByProductIdOrFail(productId);
            return res.json({ success: true, reviews: reviews.map(buildReviewOutput) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
        }
    };

    public getProductPictures = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const pictures = await this.productDAO.getPicturesByProductIdOrFail(productId);
            return res.json({ success: true, pictures: pictures.map(buildPictureOutput) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
        }
    };

    // private buildPath(picturepath: string) {
    //     return picturepath.substring(0, picturepath.indexOf('.')) + '-new' + picturepath.substring(picturepath.indexOf('.'), picturepath.length);
    // }

    // private async resizePictures(pictures: Express.Multer.File[]) {
    //     for (const picture of pictures) {
    //         const sharped = sharp(picture.path);
    //         const { height, width } = await sharped.metadata();
    //         let newWidth = width && width > 2000 ? 2000 : undefined;
    //         let newHeight = height && height > 2000 ? 2000 : undefined;

    //         if (newWidth && newHeight) {
    //             newHeight = undefined;
    //         }

    //         sharp(picture.path).resize({ width: newWidth, height: newHeight })
    //             .toFile(this.buildPath(picture.path));
    //     }
    // }

    public uploadPictures = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findByIdOrFail(productId);

            const pictures: Picture[] = [];
            for (const file of req.files as Express.Multer.File[]) {
                const picture = new Picture();
                picture.filename = file.filename;
                picture.product = product;

                pictures.push(picture);
            }

            product.pictures = [...product.pictures, ...pictures];

            const updatedProduct = await this.productDAO.save(product);

            // Resizing is working, but we need to find a way to swap the new smaller file with the old big file
            // this.resizePictures(req.files as Express.Multer.File[]);

            return res.json({ success: true, pictures: updatedProduct.pictures.map(buildPictureOutput) });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            } else {
                logger.error(error.stack);
                return res.status(500).send({ success: false, error: 'FAILED_UPLOADING_PICTURES' });
            }
        }
    };
}
