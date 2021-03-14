const validCreditCards = [
    '0000000000000000',
    '1111111111111111',
    '2222222222222222',
    '3333333333333333',
    '4444444444444444',
    '5555555555555555',
    '6666666666666666',
    '7777777777777777',
    '8888888888888888',
    '9999999999999999'
];

/** Very simple payment validation, just checking if provided card number is on the list. */
export function validatePayment(creditCardNumber: string): boolean {
    return validCreditCards.includes(creditCardNumber);
}
