import { Router } from 'express';
import { getAuthRoutes } from './auth';
import { getUserRoutes } from './user';
import { getCategoriesRouter } from './category';
import { getProductRouter } from './product';
import { getPictureRouter } from './picture';

export function getRoutes() {
    const routes = Router();
    
    routes.use('/auth', getAuthRoutes());
    routes.use('/users', getUserRoutes());
    routes.use('/categories', getCategoriesRouter());
    routes.use('/products', getProductRouter());
    routes.use('/pictures', getPictureRouter());
    
    // routes.use('/test', testRouter);
    return routes;
}

