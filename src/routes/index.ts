import { Router } from 'express';
import { getAuthRoutes } from './auth';
import { getUserRoutes } from './user';
import { categoriesRouter } from './category';

export function getRoutes() {
    const routes = Router();
    
    routes.use('/auth', getAuthRoutes());
    routes.use('/users', getUserRoutes());
    // routes.use('/test', testRouter);
    routes.use('/categories', categoriesRouter);

    return routes;
}

