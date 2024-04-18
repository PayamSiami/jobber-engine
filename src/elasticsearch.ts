import { ISellerGig, winstonLogger } from '@jobber/shared';
import { Logger } from 'winston';
import { config } from '@jobber/config';
import { Client } from '@elastic/elasticsearch';
import { ClusterHealthResponse, GetResponse } from '@elastic/elasticsearch/lib/api/types';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayElasticConnection', 'debug');

class ElasticSearch {
  public elasticSearchClient: Client;

  constructor() {
    this.elasticSearchClient = new Client({
      node: `${config.ELASTIC_SEARCH_URL}`
    });
  }

  public async checkConnection(): Promise<void> {
    let isConnected = false;
    while (!isConnected) {
      log.info('GatewayService Connecting to ElasticSearch');
      try {
        const health: ClusterHealthResponse = await this.elasticSearchClient.cluster.health({});
        log.info(`GatewayService ElasticSearch health status - ${health.status}`);
        isConnected = true;
      } catch (error) {
        log.error('Connection to ElasticSearch failed, Retrying...');
        log.log('error', 'GatewayService checkConnection() method error:', error);
      }
    }
  }

  public async checkIfIndexExist(indexName: string): Promise<boolean> {
    const result: boolean = await this.elasticSearchClient.indices.exists({ index: indexName });
    return result;
  }

  public async createIndex(indexName: string): Promise<void> {
    try {
      const result: boolean = await this.checkIfIndexExist(indexName);
      if (result) {
        log.info(`Index "${indexName}" already exist.`);
      } else {
        await this.elasticSearchClient.indices.create({ index: indexName });
        await this.elasticSearchClient.indices.refresh({ index: indexName });
        log.info(`Created index ${indexName}`);
      }
    } catch (error) {
      log.error(`An error occurred while creating the index ${indexName}`);
      log.log('error', 'AuthService createIndex() method error:', error);
    }
  }

  public async getDocumentById(index: string, gigId: string): Promise<ISellerGig> {
    try {
      const result: GetResponse = await this.elasticSearchClient.get({
        index,
        id: gigId
      });
      return result._source as ISellerGig;
    } catch (error) {
      log.log('error', 'AuthService elasticsearch getDocumentById() method error:', error);
      return {} as ISellerGig;
    }
  }
}

export const elasticSearch: ElasticSearch = new ElasticSearch();
