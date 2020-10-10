import { ValidationError } from 'class-validator';

export function hasNumber(value: string): boolean {
    return /\d/.test(value);
}

export function hasChars(value: string): boolean {
    return /\.*[a-zA-Z].*/.test(value);
}

export function validatePasswordComplexity(password: string): boolean {
    return password.length >= 6 && hasNumber(password) && hasChars(password);
};

export interface ErrorField {
    field: string;
    constraints: { [type: string]: string };
}

export function validationErrorsToErrorFields(validationErrors: ValidationError[]): ErrorField[] {
    return validationErrors.map((item) => ({ field: item.property, constraints: item.constraints }));
}

export function validateUuidV4(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}
