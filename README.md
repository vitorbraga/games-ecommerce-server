# Games Ecommerce Server
Games Ecommerce built in Node.js, Typescript, Express and TypeORM.

Steps to run this project:

1. Run `npm i` command
2. Setup database settings inside `ormconfig.json` file
3. Run `npm run start:dev` command to start development environment
4. Run `npm run start:prod` command to start production environment
5. Run `npm run start:prod:pm2` command to start production environment with pm2 clustering

With pm2:
    - Run `pm2 kill` to kill all the instances
    - Run `pm2 logs` to show logs in all the instances

Development:
TYPEORM_ENTITIES=src/entity/*.ts
TYPEORM_MIGRATIONS=src/migration/*.ts
TYPEORM_SUBSCRIBERS=src/subscriber/*.ts

Production:
TYPEORM_ENTITIES=build/entity/*.js
TYPEORM_MIGRATIONS=build/migration/*.js
TYPEORM_SUBSCRIBERS=build/subscriber/*.js
