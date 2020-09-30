import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { getRoutes } from './routes';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const connectionConfig = require('./config/ormconfig');

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

createConnection(connectionConfig)
    .then((connection) => {
        const app = express();

        app.use(cors());
        app.use(helmet());
        app.use(bodyParser.json());

        app.use('/public', express.static('public'));

        app.use('/', getRoutes());

        app.listen(4000, () => {
            console.log('Server started on port 4000!');
        });
    })
    .catch((error) => console.log(error));
