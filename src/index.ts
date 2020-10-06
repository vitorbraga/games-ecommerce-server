/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-var-requires */
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import logger from './utils/logger';
require('dotenv').config();
const connectionConfig = require('./config/ormconfig');
import { getRoutes } from './routes';

process.on('uncaughtException', (e) => {
    logger.error('uncaughtException', e);
    process.exit(1);
});

process.on('unhandledRejection', (e) => {
    logger.error('unhandledRejection', e);
    process.exit(1);
});

process.on('SIGINT', () => {
    logger.info('Received SIGINT, closing server.');
    process.exit(1);
});

const port = process.env.PORT || 4000;

createConnection(connectionConfig)
    .then((connection) => {
        const app = express();

        app.use(cors());
        app.use(helmet());
        app.use(bodyParser.json());

        app.use('/public', express.static('public'));

        app.use('/', getRoutes());

        app.listen(port, () => {
            console.log(`Server started on port ${port}!`);
        });
    })
    .catch((error) => console.log(error));
