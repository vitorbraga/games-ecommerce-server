import { validate, ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { CategoryDAO } from '../dao/category-dao';
import { ProductDAO } from '../dao/product-dao';
import { ProductStatus } from '../entities/model';
import { Picture } from '../entities/Picture';
import { Product } from '../entities/Product';
import * as ApiUtils from '../utils/api-utils';
import { buildProductOutput, buildReviewOutput, buildPictureOutput } from '../utils/data-filters';
import logger from '../utils/logger';
import * as PicturesUtils from '../utils/pictures-utils';
import * as Validators from '../utils/validators';

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
    private static consolesCategoryKey = 'consoles';
    private static gamesCategoryKey = 'games';

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
            const consoleCategory = await this.categoryDAO.findByKey(ProductController.consolesCategoryKey);
            const consolesCategoryIds = consoleCategory ? consoleCategory.subCategories.map((item) => item.id) : [];
            const gamesCategory = await this.categoryDAO.findByKey(ProductController.gamesCategoryKey);
            const gamesCategoryIds = gamesCategory ? gamesCategory.subCategories.map((item) => item.id) : [];

            let consolesProducts: Product[] = [];
            if (consolesCategoryIds.length > 0) {
                consolesProducts = await this.productDAO.search('', consolesCategoryIds, 'none');
            }

            let gamesProducts: Product[] = [];
            if (gamesCategoryIds.length > 0) {
                gamesProducts = await this.productDAO.search('', gamesCategoryIds, 'none');
            }

            const products = {
                consoles: consolesProducts.slice(0, 5).map(buildProductOutput),
                games: gamesProducts.slice(0, 5).map(buildProductOutput)
            };

            return res.json({ success: true, products });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_SEARCHING_PRODUCTS' });
        }
    };

    public getProduct = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
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
        product.price = parseInt(body.price, 10);
        product.quantityInStock = body.quantityInStock;
        product.tags = body.tags;
        product.rating = 0;

        return product;
    }

    public createProduct = async (req: ApiUtils.CustomRequest<CreateProductBody>, res: Response) => {
        try {
            const product = await this.buildProductFromBody(req.body);

            const category = await this.categoryDAO.findById(req.body.categoryId);
            if (!category) {
                return res.status(404).send({ success: false, error: 'CATEGORY_NOT_FOUND' });
            }
            product.category = category;

            product.status = ProductStatus.NOT_AVAILABLE;

            const errors: ValidationError[] = await validate(product);
            if (errors.length > 0) {
                const fields = errors.map((item) => ({ field: item.property, constraints: item.constraints }));
                return res.status(422).send({ success: false, fields });
            }

            const newProduct = await this.productDAO.save(product);

            return res.status(200).send({ success: true, product: buildProductOutput(newProduct) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_INSERTING_PRODUCT' });
        }
    };

    public updateProduct = async (req: ApiUtils.CustomRequest<UpdateProductBody>, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
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
                return res.status(422).send({ success: false, fields });
            }

            const updatedProduct = await this.productDAO.save({ ...product, ...productFromBody });

            return res.json({ success: true, product: buildProductOutput(updatedProduct) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_UPDATING_PRODUCT' });
        }
    };

    public changeProductStatus = async (req: ApiUtils.CustomRequest<ChangeProductStatusBody>, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
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

    // FIXME currently it's not possible to delete a product
    public deleteProduct = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findById(productId);
            if (!product) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            }
            const pictures = product.pictures.map((item) => item.filename);

            // TODO need to think about a solution, because currently it's not possible to remove
            await this.productDAO.delete(productId);

            for (const picture of pictures) {
                PicturesUtils.removePicture(picture);
            }

            return res.json({ success: true });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_DELETING_PRODUCT' });
        }
    };

    public getProductReviews = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
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
            if (!Validators.validateUuidV4(req.params.id)) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const pictures = await this.productDAO.getPicturesByProductIdOrFail(productId);
            return res.json({ success: true, pictures: pictures.map(buildPictureOutput) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
        }
    };

    public uploadPictures = async (req: Request, res: Response) => {
        try {
            if (!Validators.validateUuidV4(req.params.id)) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findById(productId);
            if (!product) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            }

            const pictures: Picture[] = [];
            const files = ApiUtils.getFilesFromRequest(req);

            for (const file of files) {
                const picture = new Picture();
                picture.filename = file.key;
                picture.product = product;

                pictures.push(picture);
            }

            product.pictures = [...product.pictures, ...pictures];

            const updatedProduct = await this.productDAO.save(product);

            return res.json({ success: true, pictures: updatedProduct.pictures.map(buildPictureOutput) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_UPLOADING_PICTURES' });
        }
    };
}
