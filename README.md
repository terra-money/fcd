# Terra FCD

![Banner](banner.png)

## Modules

- ### Collector(Indexer)
  - Takes block and tx from [LCD](https://docs.terra.money/How-to/Start-LCD.html#start-the-light-client-daemon-lcd) and stores into the database in a usable form
  - Stores issuance, network and staking information to database every minute
  - Collect & cache validator info and store in db
  - Calculate validator daily return
  - Collect & cache proposal info
- ### Rest API server
  - Serves data via RESTFul API

## Prerequisites

1. `Node.js` v16.x or later
1. `PostgreSQL` v12.x or later

## Project setup

### 1. Clone

```bash
$ git clone https://github.com/terra-money/fcd.git
```

### 2. Install packages

```bash
npm i
```

### 3. Setup the database

FCD requires PostgreSQL as a backend database and [TypeORM](https://github.com/typeorm/typeorm) as an ORM.

#### Create a new database for FCD

```psql
postgres=> CREATE DATABASE fcd OWNER terra;
```

#### Synchronize Database Scheme

Table schema has to be synced before running Collector by setting `synchronize` to `true`. There is many way to configure TypeORM. Example is below:

**ormconfig.js**

```javascript
module.exports = {
  name: 'default',
  type: 'postgres',
  host: 'localhost',
  database: 'terra_fcd',
  username: 'terra',
  password: '<password>',
  synchronize: true
}
```

> You shall not use CLI method, and it is good to disable synchronize option after the first sync.

### 4. Configure Environment Variables

| Name                    | Description                                | Default                          | Module(s)      | Required |
| ----------------------- | -------------------------------------------| -------------------------------- | -------------- | -------- |
| INDEXER_CHAIN_ID        | Chain ID of Terra network.                 | columbus-5                       | API, Collector | Yes      |
| INDEXER_INITIAL_HEIGHT  | The initial height of network.             | 4724001 (if columbus-5)          | Collector      | Yes      |
| INDEXER_LCD_URI         | LCD URI for Terra network.                 | https://columbus-lcd.terra.dev   | API, Collector | Yes      |
| INDEXER_RPC_URI         | RPC URI for Terra network.                 | http://localhost:26657           | API, Collector | Yes      |
| INDEXER_USE_LOG_FILE    | Write logs to logs directory.              | false                            | API, Collector | Yes      |
| INDEXER_SENTRY_DSN      | Sentry DSN for error management.           | ""                               | API, Collector | No       |
| INDEXER_SERVER_PORT     | Listening port for API server.             | 3060                             | API            | Yes      | 
| INDEXER_FCD_URI         | FCD URI for Terra network.                 | https://columbus-fcd.terra.dev   | API            | Yes      |
| INDEXER_DISABLE_API     | Disable REST APIs.                         | false                            | API            | Yes      |
| INDEXER_EXCLUDED_ROUTES | List of regex strings for excluding routes | []                               | API            | No       | 
| INDEXER_MIN_GAS_PRICES  | Minimum gas price by denom object          | {"uluna": "5.0"}                 | API            | Yes      |
| INDEXER_TOKEN_NETWORK   | Network specifier for whitelisted tokens   | mainnet / testnet                | API            | Yes      |

> In Terra, we use [direnv](https://direnv.net) for managing environment variable for development. See [sample of .envrc](.envrc_sample)

## Running modules

### Developement

- Collector
  ```bash
  npm run coldev
  ```
- API
  ```bash
  npm run dev
  ```
- Test
  ```bash
  npm run test
  ```
  - Tests are designed to use testnet

### Production

- Collector
  ```bash
  npm run collector
  ```
- API
  ```bash
  npm run start
  ```

## APIDoc & Swagger

### apiDoc (https://apidocjs.com)

- Generate by `npm run apidoc`
- Access UI from: `http://localhost:3060/apidoc`

### Swagger 2.0 (https://swagger.io)

- Generate by `npm run swagger`
- Access UI from: `http://localhost:3060/swagger`
- Access the definition from: `http://localhost:3060/static/swagger.json`

### Generate swagger for [`AWS`](https://aws.amazon.com/api-gateway/) api gateway

```sh
npm run swagger -- --apigateway
```

- Generated file can be directly imported to aws api gateway
- NB : its uses empty schema for response object as api gateway support object and properties name only having alphanum.

### Generate combined swagger for lcd and fcd

```sh
npm run mergeswagger -- -o filename
```

- Combined swagger file will be saved in `static` directory in project `root`
- If no filename provided as command line argument then default saved file name is `combined-swagger.json`
- To generate combined swagger for AWS API Gateway add `--apigateway` parameter

## Find LocalTerra to run whole ecosystem locally

https://github.com/terra-money/localterra
