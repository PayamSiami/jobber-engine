import express, { Express } from 'express';
import { GatewayServer } from '@jobber/server';
import { redisConnection } from '@jobber/redis/redis.connection';

import { mysqlDatabase } from './mysql.database';
import { config } from './config';

class Application {
  public initialize(): void {
    config.cloudinaryConfig();
    const app: Express = express();
    const server: GatewayServer = new GatewayServer(app);
    server.start();
    redisConnection.redisConnect();
    mysqlDatabase.databaseConnection();
  }
}

const application: Application = new Application();
application.initialize();
