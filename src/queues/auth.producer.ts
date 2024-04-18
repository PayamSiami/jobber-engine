import { config } from '@jobber/config';
import { winstonLogger } from '@jobber/shared';
import { Channel } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from '@jobber/queues/connection';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authServiceProducer', 'debug');

export async function publishDirectMessage(
  channel: Channel,
  exchangeName: string,
  routingKey: string,
  message: string,
  logMessage: string
): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    await channel.assertExchange(exchangeName, 'direct');
    channel.publish(exchangeName, routingKey, Buffer.from(message));
    log.info(logMessage);
  } catch (error) {
    log.log('error', 'AuthService Provider publishDirectMessage() method error:', error);
  }
}
