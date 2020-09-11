const EMAIL_REGEX = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function hasNumber(value: string) {
    return /\d/.test(value);
}

export const isEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email.toLowerCase());
};

export const checkPasswordComplexity = (password: string): boolean => {
    return password.length >= 6 && hasNumber(password);
};

export const validateParams: (targetObject: any, validatorObject: any) => boolean = (targetObject, validatorObject) => {
    if (typeof targetObject !== typeof validatorObject) return false;
    if (typeof targetObject === 'object') {
        let validObject = true;
        if (Array.isArray(targetObject)) {
            for (const subObject of targetObject) {
                validObject = validObject && validateParams(subObject, validatorObject[0]);
            }
        } else {
            for (const key of Object.keys(validatorObject)) {
                if (typeof targetObject[key] === 'object') validObject = validObject && validateParams(targetObject[key], validatorObject[key]);
                if (typeof targetObject[key] !== typeof validatorObject[key]) validObject = false;
            }
        }
        return validObject;
    }

    return true;
};
