require('dotenv').config();

module.exports = {
    type: 'postgres',
    host: process.env.TYPEORM_HOST,
    port: 5432,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    synchronize: true,
    logging: false,
    entities: [process.env.TYPEORM_ENTITIES],
    migrations: [process.env.TYPEORM_MIGRATIONS],
    cli: {
        migrationsDir: 'src/migration'
    },
    migrationsRun: false
};
