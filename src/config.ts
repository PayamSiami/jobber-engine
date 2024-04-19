import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({});

if (process.env.ENABLE_APM === '1') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('elastic-apm-node').start({
    serviceName: 'jobber-notification',
    serverUrl: process.env.ELASTIC_APM_SERVER_URL,
    secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
    environment: process.env.NODE_ENV,
    active: true,
    captureBody: 'all',
    errorOnAbortedRequests: true,
    captureErrorLogStackTraces: 'always'
  });
}

class Config {
  public DATABASE_HOST: string | undefined;
  public DATABASE_USER: string | undefined;
  public DATABASE_PASSWORD: string | undefined;
  public DATABASE_NAME: string | undefined;
  public NODE_ENV: string | undefined;
  public DATABASE_URL: string | undefined;
  public CLIENT_URL: string | undefined;
  public SENDER_EMAIL: string | undefined;
  public SENDER_EMAIL_PASSWORD: string | undefined;
  public RABBITMQ_ENDPOINT: string | undefined;
  public ELASTIC_SEARCH_URL: string | undefined;
  public MYSQL_DB: string | undefined;
  public JWT_TOKEN: string | undefined;
  public CLOUD_NAME: string | undefined;
  public CLOUD_API_KEY: string | undefined;
  public CLOUD_API_SECRET: string | undefined;
  public GATEWAY_JWT_TOKEN: string | undefined;
  public API_GATEWAY_URL: string | undefined;
  public REDIS_HOST: string | undefined;
  public MESSAGE_BASE_URL: string | undefined;
  public STRIPE_API_KEY: string | undefined;
  public ORDER_BASE_URL: string | undefined;
  public CLUSTER_TYPE: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public AUTH_BASE_URL: string | undefined;
  public USERS_BASE_URL: string | undefined;
  public GIG_BASE_URL: string | undefined;
  public REVIEW_BASE_URL: string | undefined;

  constructor() {
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
    this.DATABASE_URL = process.env.DATABASE_URL || '';
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';
    this.CLIENT_URL = process.env.CLIENT_URL || '';
    this.AUTH_BASE_URL = process.env.AUTH_BASE_URL || '';
    this.USERS_BASE_URL = process.env.USERS_BASE_URL || '';
    this.GIG_BASE_URL = process.env.GIG_BASE_URL || '';
    this.MESSAGE_BASE_URL = process.env.MESSAGE_BASE_URL || '';
    this.REVIEW_BASE_URL = process.env.REVIEW_BASE_URL || '';
    this.REDIS_HOST = process.env.REDIS_HOST || '';
    this.ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL || '';
    this.CLUSTER_TYPE = process.env.CLUSTER_TYPE || '';
    this.DATABASE_HOST = process.env.DATABASE_HOST || '';
    this.DATABASE_USER = process.env.DATABASE_USER || '';
    this.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || '';
    this.DATABASE_NAME = process.env.DATABASE_NAME || '';
    this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
    this.ORDER_BASE_URL = process.env.ORDER_BASE_URL || '';
    this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
    this.NODE_ENV = process.env.NODE_ENV || '';
    this.JWT_TOKEN = process.env.JWT_TOKEN || '';
    this.GATEWAY_JWT_TOKEN = process.env.GATEWAY_JWT_TOKEN || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || '';
    this.MYSQL_DB = process.env.MYSQL_DB || '';
    this.CLOUD_NAME = process.env.CLOUD_NAME || '';
    this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
    this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
    this.API_GATEWAY_URL = process.env.API_GATEWAY_URL || '';
    this.STRIPE_API_KEY = process.env.STRIPE_API_KEY || '';
  }

  public cloudinaryConfig(): void {
    cloudinary.v2.config({
      cloud_name: this.CLOUD_NAME,
      api_key: this.CLOUD_API_KEY,
      api_secret: this.CLOUD_API_SECRET
    });
  }
}

export const config: Config = new Config();
