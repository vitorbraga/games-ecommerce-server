# Games Ecommerce Server
This repository is part of a long-term project of mine, called *Games Ecommerce*.
Like the name says, it is an ecommerce focused on Games, to sell physical games and consoles.
All the products and transactions are fake, so in case of a user making order, this user won't be charged and also won't receive the product.

This repository is the backend for Games Ecommerce. It handles all the requests from the Store and the Admin Portal, and it manages the access to the database.

There are other two repositories that complement *games-ecommerce-server*:

- [games-ecommerce-app](https://github.com/vitorbraga/games-ecommerce-app): frontend Store, where users can see the products and make orders
- [games-ecommerce-admin](https://github.com/vitorbraga/games-ecommerce-admin): Admin Portal, so administrators can handle the management of products, orders and users.



## Current State

The project is in an MVP state. It has a basic e-commerce functionality. I still have a lot of features and improvements to make and I plan to implement them over time.
There are no tests implemented yet. I focused on features, like it is in a real-world company. Stakeholders want features, especially in the early stages when we are building a MVP. As this project is still a MVP, I decided to focus on fast delivering of the core features first.
Implementing tests is in my backlog, with a high priority.



## Live demo

You can find a live demo of this project hosted in Heroku:

https://games-ecommerce-app.herokuapp.com/

You can create an account and simulate orders. Feel free to explore it 😉

OBS: As this is hosted in a Free Plan in Heroku, the machine where this project is hosted can be idle. So, if you see to response, give it a couple of minutes and the machine will be active again.



## Stack

- **NodeJs**: Simple and fast to implement robust applications
- **Typescript**: I like it because it prevents lots of errors at compile time
- **Express**: Lightweight server, easy to use
- **TypeORM**: ORM in Typescript to simplify the access to the Database
- **PostgreSQL**: Database I chose for this project
- **AWS S3**: to store and retrieve product pictures
- **Multer**: to receive, validate and upload files to S3

This server contains a REST API which both the Store and the Admin Portal use.



## Current features

The list above contains the main features of the server.

- [x] Authentication	
  - [x] JWT Authentication
  - [x] Middlewares for permission checking
  - [x] Argon2 encryption
- [x] User API
  - [x] Register, retrieve, change password
  - [x] Password recovery process
    - [x] Sends email to the user, with a link to reset the password
- [x] Address API
  - [x] Create, retrieve, delete address
- [x] Product API
  - [x] Create, retrieve, update
  - [x] Product search: FullText search with weights
- [x] Picture API
  - [x] Upload picture to product, retrieve product pictures
  - [x] Upload files to S3 using [Multer](https://www.npmjs.com/package/multer)
- [x] Order API
  - [x] Create and retrieve orders
  - [x] Stock management
- [x] Category API
  - [x] Create, retrieve tree, delete subcategories
  - [x] [Tree Entity schema](https://orkhan.gitbook.io/typeorm/docs/tree-entities) for Category
- [x] TypeORM migrations
  - [x] Create Admin User, create countries, create categories



## Next features in the backlog

- [ ] Delete product: currently not working due to the relation with OrderItem
- [ ] Testing 80% Coverage
  - [x] API/Controllers tests (92%)
  - [x] Utils test (89%)
  - [ ] Middlewares
  - [ ] DAO and database access
- [ ] Products Pagination
- [ ] Prevent same order to be generated
- [ ] Rate limiting to prevent repeated requests and server flooding
- [ ] Admin Dashboard Overview
- [ ] Update address
- [ ] Product Reviews
- [ ] Payment Simulator
- [ ] Discounts/Sale
- [ ] Coupons



## Running the project

Steps to run this project:

##### First things first:

Run `npm i` command to install the dependencies.

##### Running development

1. Run `npm run start:dev` command to start development environment and you are good to go
2. The server will start at `http://localhost:4000`

##### Running production

1. Run `npm run build` to generate JS files in the `/build` folder
2. Run `npm run start:prod` command to start production environment
3. The server will start at `http://localhost:4000`

***IMPORTANT***: to run the project correctly, you'll need to setup the proper environment variables for the desired environment. Please check the table below to know more about the necessary environment variables.



## Environment variables

This application is complex, then we have lots of configuration to do. As this configuration is either confidential data or is environment-based, we need to make environment variables out of them, so we are more protected and the application can run properly.

| Variable              | Expected values                                              |
| --------------------- | ------------------------------------------------------------ |
| NODE_ENV              | Environment: *development* or *production*                   |
| DATABASE_URL          | Something like postgres://username:password@host:port/database<br />*Example: postgres://postgres:root@127.0.0.1:5432/games-ecommerce*<br /><br />*OBS: if you're trying to access an external database that requires TLS connection, you will need to uncomment the commented code in ormconfig.js* |
| TYPEORM_ENTITIES      | Folder for TypeORM look to your entities and build your database.<br />*production: src/entity/.t*s<br/>*development: build/entity/*.js*<br/> |
| TYPEORM_MIGRATIONS    | Folder with database migrations you want TypeORM to run.<br />*production: src/migration/.t*s<br/>*development: build/migration/*.js<br/> |
| S3_BUCKET_NAME        | Name of the S3 bucket where you will store the product pictures |
| AWS_ACCESS_KEY_ID     | AWS Access Key: something like *AKIAIOSFODNN7EXAMPLE*        |
| AWS_SECRET_ACCESS_KEY | AWS Secret Access key: something like *wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY* |
| EMAIL_USERNAME        | Email account username to send emails to the users           |
| EMAIL_PASSWORD        | Email account password to send emails to the users           |
| ENCRYPT_IV            | Encryption IV. Can be any **16-letter string**.<br />Used for encrypting the user ID for password recovery. |
| ENCRYPT_SECRET        | Encryption secret. Can be any **16-letter string**.                        |
| APP_SERVER_URL        | URL to the Store. Something like: http://localhost:3000      |



