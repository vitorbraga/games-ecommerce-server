import logger from '../../src/utils/logger';
import * as sinon from 'sinon';
import { expect } from 'chai';

describe('logger', function () {
    it('generateDate', () => {
        const result = logger.generateDate();
        expect(result.length).equal(24);
        expect(result.charAt(result.length - 1)).equal('Z');
    });

    it('generateFinalMessage INFO', () => {
        const result = logger.generateFinalMessage('INFO', 'Info message');
        expect(result.charAt(0)).equal('[');
        expect(result.charAt(25)).equal(']');
        expect(result.includes('INFO')).equal(true);
        expect(result.includes('Info message')).equal(true);
    });

    it('Should call logger.info', () => {
        const consoleInfoStub = sinon.stub(console, 'info');
        consoleInfoStub.returns();

        logger.info('Info message');
        expect(consoleInfoStub.callCount).equal(1);
    });

    it('Should call logger.warn', () => {
        const consoleWarnStub = sinon.stub(console, 'warn');
        consoleWarnStub.returns();

        logger.warn('Warn message');
        expect(consoleWarnStub.callCount).equal(1);
    });

    it('Should call logger.debug', () => {
        const consoleDebugStub = sinon.stub(console, 'debug');
        consoleDebugStub.returns();

        logger.debug('Debug message');
        expect(consoleDebugStub.callCount).equal(1);
    });

    it('Should call logger.error', () => {
        const consoleErrorStub = sinon.stub(console, 'error');
        consoleErrorStub.returns();

        logger.error('Error message');
        expect(consoleErrorStub.callCount).equal(1);
    });
});
