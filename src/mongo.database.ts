import { winstonLogger } from '@jobber/shared';
import { Logger } from 'winston';
import { config } from '@jobber/config';
import mongoose from 'mongoose';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

class MongoDatabase {
  public async databaseConnection(): Promise<void> {
    try {
      await mongoose.connect(`${config.DATABASE_URL}`);
      log.info('Users service successfully connected to mongo database.');
    } catch (error) {
      log.log('error', 'UsersService databaseConnection() method error:', error);
    }
  }
}

export const mongoDatabase: MongoDatabase = new MongoDatabase();
