import { winstonLogger } from '@jobber/shared';
import { Logger } from 'winston';
import { config } from '@jobber/config';
import { Sequelize } from 'sequelize';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authDatabaseServer', 'debug');

class MysqlDatabase {
  sequelize: Sequelize = new Sequelize(process.env.MYSQL_DB!, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      multipleStatements: true
    }
  });

  public async databaseConnection(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      log.info('AuthService Mysql database connection has been established successfully.');
    } catch (error) {
      log.error('Auth Service - Unable to connect to database.');
      log.log('error', 'AuthService databaseConnection() method error:', error);
    }
  }
}

export const mysqlDatabase: MysqlDatabase = new MysqlDatabase();
