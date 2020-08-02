import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { routes } from './routes';
import * as dotenv from 'dotenv';
import { getConnectionConfig } from './config/ormconfig';

dotenv.config();

process.on('uncaughtException', (e) => {
    console.log('uncaughtException', e);
    process.exit(1);
});

process.on('unhandledRejection', (e) => {
    console.log('unhandledRejection', e);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, closing server.');
    process.exit(1);
});

const connectionConfig = getConnectionConfig();
createConnection(connectionConfig)
    .then(async (connection) => {
        // Create a new express application instance
        const app = express();

        // Call midlewares
        app.use(cors());
        app.use(helmet());
        app.use(bodyParser.json());

        // Set all routes from routes folder
        app.use('/', routes);

        app.listen(4000, () => {
            console.log('Server started on port 4000!');
        });
    })
    .catch((error) => console.log(error));
