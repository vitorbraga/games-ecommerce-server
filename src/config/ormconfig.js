module.exports = {
    name: 'default',
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [process.env.TYPEORM_ENTITIES],
    migrations: [process.env.TYPEORM_MIGRATIONS],
    cli: {
        migrationsDir: 'src/migration'
    },
    migrationsRun: false
    // ssl: true, // Uncomment to connect to Heroku's database locally
    // extra: {
    //     ssl: {
    //         rejectUnauthorized: false
    //     }
    // }
};
