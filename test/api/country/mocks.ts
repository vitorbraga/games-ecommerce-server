import { Country } from '../../../src/entities/Country';
import { CountryOutput } from '../../../src/utils/data-filters';

export const country1Id = 'b577f9f0-09cf-40f3-9156-066561a99056';

export const country1: Country = {
    id: 'b577f9f0-09cf-40f3-9156-066561a99056',
    name: 'Netherlands',
    addresses: []
};

export const country1Output: CountryOutput = {
    id: 'b577f9f0-09cf-40f3-9156-066561a99056',
    name: 'Netherlands'
};

export const country2: Country = {
    id: '81441140-88a8-41aa-be86-0bab638f6261',
    name: 'Brazil',
    addresses: []
};

export const country2Output: CountryOutput = {
    id: '81441140-88a8-41aa-be86-0bab638f6261',
    name: 'Brazil'
};

export const country3: Country = {
    id: 'c177784f-c6e1-4492-ba3d-9e201177a0e9',
    name: 'Uruguay',
    addresses: []
};

export const country3Output: CountryOutput = {
    id: 'c177784f-c6e1-4492-ba3d-9e201177a0e9',
    name: 'Uruguay'
};

export const allCountries: Country[] = [country1, country2];

export const allCountriesOutput: CountryOutput[] = [country1Output, country2Output];
