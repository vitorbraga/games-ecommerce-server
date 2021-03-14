import { Router } from 'express';
import { CountryController } from '../controllers/country-controller';
import { checkRole } from '../middlewares/checkRole';
import { checkJwt } from '../middlewares/checkJwt';

export function getCountriesRouter(): Router {
    const countryController = new CountryController();
    const countriesRouter = Router();

    countriesRouter.get('/', countryController.getAllCountries);

    countriesRouter.get('/:id', countryController.getCountry);

    countriesRouter.post('/', [checkJwt, checkRole(['ADMIN'])], countryController.createCountry);

    return countriesRouter;
}
