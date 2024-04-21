import { winstonLogger } from '@jobber/shared';
import { Logger } from 'winston';
import { config } from '@jobber/config';
import { Pool } from 'pg';

class PostgresqlDatabase {
  private log: Logger;
  public pool: Pool;

  constructor() {
    this.log = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'reviewDatabaseServer', 'debug');
    this.pool = new Pool({
      host: `${config.DATABASE_HOST}`,
      user: `${config.DATABASE_USER}`,
      password: `${config.DATABASE_PASSWORD}`,
      port: 5432,
      database: `${config.DATABASE_NAME}`,
      ...(config.NODE_ENV !== 'development' &&
        config.CLUSTER_TYPE === 'AWS' && {
          ssl: {
            rejectUnauthorized: false
          }
        })
    });

    this.pool.on('error', (error: Error) => {
      this.log.log('error', 'pg client error', error);
      process.exit(-1);
    });
  }

  private createTableText = `
    CREATE TABLE IF NOT EXISTS public.reviews (
      id SERIAL UNIQUE,
      gigId text NOT NULL,
      reviewerId text NOT NULL,
      orderId text NOT NULL,
      sellerId text NOT NULL,
      review text NOT NULL,
      reviewerImage text NOT NULL,
      reviewerUsername text NOT NULL,
      country text NOT NULL,
      reviewType text NOT NULL,
      rating integer DEFAULT 0 NOT NULL,
      createdAt timestamp DEFAULT CURRENT_DATE,
      PRIMARY KEY (id)
    );

    CREATE INDEX IF NOT EXISTS gigId_idx ON public.reviews (gigId);

    CREATE INDEX IF NOT EXISTS sellerId_idx ON public.reviews (sellerId);
  `;

  public async databaseConnection(): Promise<void> {
    try {
      await this.pool.connect();
      this.log.info('Review service successfully connected to postgresql database.');
      await this.pool.query(this.createTableText);
    } catch (error) {
      this.log.error('ReviewService - Unable to connect to database');
      this.log.log('error', 'ReviewService () method error:', error);
    }
  }
}

export const postgresqlDatabase = new PostgresqlDatabase();
export const pool = postgresqlDatabase.pool;
