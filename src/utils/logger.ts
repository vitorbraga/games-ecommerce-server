export type LevelType = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

class Logger {
    generateDate(): string {
        const timezoneOffsetMilliseconds = (new Date()).getTimezoneOffset() * 60000;
        return new Date(Date.now() - timezoneOffsetMilliseconds).toISOString();
    }

    generateFinalMessage(level: LevelType, message: string): string {
        return `[${this.generateDate()}] ${level} ${message}`;
    }

    public info(...message: any[]) {
        console.info(this.generateFinalMessage('INFO', message.join(', ')));
    }

    public warn(...message: any[]) {
        console.warn(this.generateFinalMessage('WARN', message.join(', ')));
    }

    public error(...message: any[]) {
        console.error(this.generateFinalMessage('ERROR', message.join(', ')));
    }

    public debug(...message: any[]) {
        console.debug(this.generateFinalMessage('DEBUG', message.join(', ')));
    }
}

export default new Logger();
