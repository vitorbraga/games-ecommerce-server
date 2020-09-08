import { Request, Response } from 'express';
import { ProductDAO } from '../dao/product-dao';
import { Product } from '../entity/Product';
import { ValidationError, validate } from 'class-validator';
import { CategoryDAO } from '../dao/category-dao';
import { NotFoundError } from '../errors/not-found-error';
import { CustomRequest } from '../utils/api-utils';
import { ProductStatus } from '../entity/model';

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
        const products = await this.productDAO.findAll()
        return res.status(200).send({ success: true, products });
    };

    public getProduct = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            const product = await this.productDAO.findByIdOrFail(productId);
            return res.json({ success: true, product });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
        }
    };

    private async buildProductFromBody(body: CreateProductBody | UpdateProductBody): Promise<Product> {
        const product = new Product();
        product.title = body.title;
        product.description = body.description;
        product.price = parseInt(body.price); // TODO check this
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
            return res.status(200).send({ success: true, product: newProduct });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CATEGORY_NOT_FOUND' });
            } else {
                console.log(error);
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
            return res.json({ success: true, product: updatedProduct });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'CATEGORY_NOT_FOUND' });
            } else {
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
            return res.json({ success: true, product: updatedProduct });
        } catch (error) {
            return res.status(500).send({ success: false, error: 'FAILED_UPDATING_PRODUCT' });
        }
    };

    public deleteProduct = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_PRODUCT_ID' });
            }

            const productId: string = req.params.id;

            await this.productDAO.delete(productId);
            return res.json({ success: true });
        } catch (error) {
            if (error instanceof NotFoundError) {
                return res.status(404).send({ success: false, error: 'PRODUCT_NOT_FOUND' });
            } else {
                return res.status(500).send({ success: false, error: 'FAILED_DELETING_PRODUCT' });
            }
        }
    };
}
