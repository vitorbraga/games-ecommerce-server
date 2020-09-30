// import { ConnectionOptions } from 'typeorm';

// export default getConnectionConfig = (): ConnectionOptions => {
//     return {
//         name: 'default',
//         type: 'postgres',
//         host: process.env.TYPEORM_HOST,
//         port: 5432,
//         username: process.env.TYPEORM_USERNAME,
//         password: process.env.TYPEORM_PASSWORD,
//         database: process.env.TYPEORM_DATABASE,
//         synchronize: true,
//         logging: false,
//         entities: [
//             process.env.TYPEORM_ENTITIES || 'src/entity/*.ts'
//         ],
//         migrations: [
//             process.env.TYPEORM_MIGRATIONS || 'src/migration/*.ts'
//         ],
//         subscribers: [
//             process.env.TYPEORM_SUBSCRIBERS || 'src/subscriber/*.ts'
//         ],
//         cli: {
//             entitiesDir: 'src/entity',
//             migrationsDir: 'src/migration',
//             subscribersDir: 'src/subscriber'
//         }
//     };
// };
