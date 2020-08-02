import { ConnectionOptions } from 'typeorm';

export const getConnectionConfig = (): ConnectionOptions => {
    return {
        type: 'sqlite',
        database: 'database.sqlite',
        // type: 'mysql',
        // host: process.env.TYPEORM_HOST,
        // port: 3306,
        // username: process.env.TYPEORM_USERNAME,
        // password: process.env.TYPEORM_PASSWORD,
        // database: process.env.TYPEORM_DATABASE,
        synchronize: true,
        logging: false,
        entities: [
            process.env.TYPEORM_ENTITIES || 'src/entity/*.ts'
        ],
        migrations: [
            process.env.TYPEORM_MIGRATIONS || 'src/migration/*.ts'
        ],
        subscribers: [
            process.env.TYPEORM_SUBSCRIBERS || 'src/subscriber/*.ts'
        ],
        cli: {
            entitiesDir: 'src/entity',
            migrationsDir: 'src/migration',
            subscribersDir: 'src/subscriber'
        }
    };
};
