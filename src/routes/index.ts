import { Router } from 'express';
import { getAuthRoutes } from './auth';
import { getUserRoutes } from './user';
import { getCategoriesRouter } from './category';
import { getProductRouter } from './product';

export function getRoutes() {
    const routes = Router();
    
    routes.use('/auth', getAuthRoutes());
    routes.use('/users', getUserRoutes());
    // routes.use('/test', testRouter);
    routes.use('/categories', getCategoriesRouter());
    routes.use('/products', getProductRouter());

    return routes;
}

