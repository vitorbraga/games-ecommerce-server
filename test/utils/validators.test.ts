import { expect } from 'chai';
import { ValidationError } from 'class-validator';
import * as Validators from '../../src/utils/validators';

describe('Validators', function () {
    describe('hasNumber', function () {
        const testCasesExamples = [
            { value: 'adsdasjagdsjhgajg2dsagh', expectedResult: true },
            { value: 'adsdasjagdsjhgadsagh', expectedResult: false },
            { value: '22222222222', expectedResult: true },
            { value: '2dsaadsdassadddsaadsas', expectedResult: true },
            { value: 'sdsaadsdassadddsaadsas3', expectedResult: true },
            { value: 'agsuyfasuydasfdsauyfuydfguydasfgudsadudsafbudsaybdsaiuodsaudiasgdsadbsainyopdsaioodsyavby', expectedResult: false }
        ];

        for (const testCase of testCasesExamples) {
            it(`String ${testCase.value} should return ${testCase.expectedResult}`, () => {
                const result = Validators.hasNumber(testCase.value);
                expect(result).equal(testCase.expectedResult);
            });
        }
    });

    describe('hasChars', function () {
        const testCasesExamples = [
            { value: '2222222222s', expectedResult: true },
            { value: '22222222222', expectedResult: false },
            { value: 's', expectedResult: true },
            { value: '2', expectedResult: false }
        ];

        for (const testCase of testCasesExamples) {
            it(`String ${testCase.value} should return ${testCase.expectedResult}`, () => {
                const result = Validators.hasChars(testCase.value);
                expect(result).equal(testCase.expectedResult);
            });
        }
    });

    describe('validatePasswordComplexity', function () {
        const testCasesExamples = [
            { value: '123', expectedResult: false },
            { value: '123456', expectedResult: false },
            { value: '12334s', expectedResult: true },
            { value: 'abcdef', expectedResult: false },
            { value: '2dsaasdsdassadddsaadsas', expectedResult: true },
            { value: 'sdsaadsdassadddsaadsas3', expectedResult: true },
            { value: 'agsuyfasuydasfdsauyfuydfguydasfgudsadudsafbudsaybdsaiuodsaudiasgdsadbsainyopdsaioodsyavby', expectedResult: false }
        ];

        for (const testCase of testCasesExamples) {
            it(`String ${testCase.value} should return ${testCase.expectedResult}`, () => {
                const result = Validators.validatePasswordComplexity(testCase.value);
                expect(result).equal(testCase.expectedResult);
            });
        }
    });

    describe('validateUuidV4', function () {
        const testCasesExamples = [
            { value: '9f78a83d-5231-4cb1-9167-bc4bf7696602', expectedResult: true },
            { value: '9b1216d6-0aae-4112-a40b-3728ad250335', expectedResult: true },
            { value: 'abcdef', expectedResult: false },
            { value: '71t2g2316321f78', expectedResult: false },
            { value: '9f78a83d-5231-4cb1-9167-bc4bf76966029f78a83d-5231-4cb1-9167-bc4bf7696602', expectedResult: false }
        ];

        for (const testCase of testCasesExamples) {
            it(`String ${testCase.value} should return ${testCase.expectedResult}`, () => {
                const result = Validators.validateUuidV4(testCase.value);
                expect(result).equal(testCase.expectedResult);
            });
        }
    });

    describe('validationErrorsToErrorFields', function () {
        it('Should transform ValidationError to ErrorField', () => {
            const validationErrors: ValidationError[] = [
                { property: 'firstName', constraints: { 'wrong-input': 'This field is invalid' }, children: [] },
                { property: 'password', constraints: { 'wrong-input': 'You need a stronger password' }, children: [] }
            ];

            const result: Validators.ErrorField[] = Validators.validationErrorsToErrorFields(validationErrors);
            expect(result).to.deep.equal([
                { field: 'firstName', constraints: { 'wrong-input': 'This field is invalid' } },
                { field: 'password', constraints: { 'wrong-input': 'You need a stronger password' } }]);
        });
    });
});
