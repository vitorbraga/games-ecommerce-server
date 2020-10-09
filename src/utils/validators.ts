import { ValidationError } from 'class-validator';

function hasNumber(value: string): boolean {
    return /\d/.test(value);
}

export function checkPasswordComplexity(password: string): boolean {
    return password.length >= 6 && hasNumber(password);
};

interface ErrorField {
    field: string;
    constraints: { [type: string]: string };
}
export function validationErrorsToErrorFields(validationErrors: ValidationError[]): ErrorField[] {
    return validationErrors.map((item) => ({ field: item.property, constraints: item.constraints }));
}

export function checkUuidV4(value: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}
