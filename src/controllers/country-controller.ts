import { Request, Response } from 'express';
import { CountryDAO } from '../dao/country-dao';
import { Country } from '../entity/Country';
import { buildCountryOutput } from '../utils/data-filters';
import logger from '../utils/logger';

export class CountryController {
    private countryDAO: CountryDAO;

    constructor() {
        this.countryDAO = new CountryDAO();
    }

    public getAllCountries = async (req: Request, res: Response) => {
        const countries = await this.countryDAO.findAll();
        return res.status(200).send({ success: true, countries: countries.map(buildCountryOutput) });
    };

    public getCountry = async (req: Request, res: Response) => {
        try {
            if (!req.params.id) {
                return res.status(422).json({ success: false, error: 'MISSING_COUNTRY_ID' });
            }

            const countryId: string = req.params.id;

            const country = await this.countryDAO.findByIdOrFail(countryId);
            return res.json({ success: true, country: buildCountryOutput(country) });
        } catch (error) {
            return res.status(404).send({ success: false, error: 'COUNTRY_NOT_FOUND' });
        }
    };

    public createCountry = async (req: Request, res: Response) => {
        try {
            const { name } = req.body;

            const country = new Country();
            country.name = name;

            const newCountry = await this.countryDAO.save(country);
            return res.status(200).send({ success: true, category: buildCountryOutput(newCountry) });
        } catch (error) {
            logger.error(error.stack);
            return res.status(500).send({ success: false, error: 'FAILED_CREATING_COUNTRY' });
        }
    };
}
