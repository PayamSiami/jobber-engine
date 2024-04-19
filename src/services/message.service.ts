import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@jobber/services/axios';
import { config } from '@jobber/config';
import { IConversationDocument, IMessageDetails, IMessageDocument, lowerCase } from '@jobber/shared';
import { ConversationModel } from '@jobber/models/conversation.schema';
import { MessageModel } from '@jobber/models/message.schema';
import { publishDirectMessage } from '@jobber/queues/auth.producer';
import { channel, socketIO } from '@jobber/server';

export let axiosMessageInstance: ReturnType<typeof axios.create>;

class MessageService {
  constructor() {
    const axiosService: AxiosService = new AxiosService(`${config.MESSAGE_BASE_URL}/api/v1/message`, 'message');
    axiosMessageInstance = axiosService.axios;
  }

  async getConversation(sender: string, receiver: string): Promise<IConversationDocument[]> {
    const query = {
      $or: [
        { senderUsername: sender, receiverUsername: receiver },
        { senderUsername: receiver, receiverUsername: sender }
      ]
    };
    const conversation: IConversationDocument[] = await ConversationModel.aggregate([{ $match: query }]);
    return conversation;
  }

  async getMessages(sender: string, receiver: string): Promise<IMessageDocument[]> {
    const query = {
      $or: [
        { senderUsername: sender, receiverUsername: receiver },
        { senderUsername: receiver, receiverUsername: sender }
      ]
    };
    const messages: IMessageDocument[] = await MessageModel.aggregate([{ $match: query }, { $sort: { createdAt: 1 } }]);
    return messages;
  }

  async getUserConversationList(username: string): Promise<IMessageDocument[]> {
    const query = {
      $or: [{ senderUsername: username }, { receiverUsername: username }]
    };
    const messages: IMessageDocument[] = await MessageModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$conversationId',
          result: { $top: { output: '$$ROOT', sortBy: { createdAt: -1 } } }
        }
      },
      {
        $project: {
          _id: '$result._id',
          conversationId: '$result.conversationId',
          sellerId: '$result.sellerId',
          buyerId: '$result.buyerId',
          receiverUsername: '$result.receiverUsername',
          receiverPicture: '$result.receiverPicture',
          senderUsername: '$result.senderUsername',
          senderPicture: '$result.senderPicture',
          body: '$result.body',
          file: '$result.file',
          gigId: '$result.gigId',
          isRead: '$result.isRead',
          hasOffer: '$result.hasOffer',
          createdAt: '$result.createdAt'
        }
      }
    ]);
    return messages;
  }

  async getUserMessages(messageConversationId: string): Promise<IMessageDocument[]> {
    const messages: IMessageDocument[] = await MessageModel.aggregate([
      { $match: { conversationId: messageConversationId } },
      { $sort: { createdAt: 1 } }
    ]);
    return messages;
  }

  public async createConversation(conversationId: string, sender: string, receiver: string): Promise<void> {
    await ConversationModel.create({
      conversationId,
      senderUsername: sender,
      receiverUsername: receiver
    });
  }

  public async updateOffer(messageId: string, type: string): Promise<IMessageDocument> {
    const message: IMessageDocument = (await MessageModel.findOneAndUpdate(
      { _id: messageId },
      {
        $set: {
          [`offer.${type}`]: true
        }
      },
      { new: true }
    )) as IMessageDocument;
    return message;
  }

  public async markMessageAsRead(messageId: string): Promise<IMessageDocument> {
    const message: IMessageDocument = (await MessageModel.findOneAndUpdate(
      { _id: messageId },
      {
        $set: {
          isRead: true
        }
      },
      { new: true }
    )) as IMessageDocument;
    socketIO.emit('message updated', message);
    return message;
  }

  public async markManyMessagesAsRead(receiver: string, sender: string, messageId: string): Promise<IMessageDocument> {
    (await MessageModel.updateMany(
      { senderUsername: sender, receiverUsername: receiver, isRead: false },
      {
        $set: {
          isRead: true
        }
      }
    )) as IMessageDocument;
    const message: IMessageDocument = (await MessageModel.findOne({ _id: messageId }).exec()) as IMessageDocument;
    socketIO.emit('message updated', message);
    return message;
  }

  async markMultipleMessagesAsRead(receiverUsername: string, senderUsername: string, messageId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosMessageInstance.put('/mark-multiple-as-read', {
      receiverUsername,
      senderUsername,
      messageId
    });
    return response;
  }

  public async addMessage(data: IMessageDocument): Promise<IMessageDocument> {
    const message: IMessageDocument = (await MessageModel.create(data)) as IMessageDocument;
    if (data.hasOffer) {
      const emailMessageDetails: IMessageDetails = {
        sender: data.senderUsername,
        amount: `${data.offer?.price}`,
        buyerUsername: lowerCase(`${data.receiverUsername}`),
        sellerUsername: lowerCase(`${data.senderUsername}`),
        title: data.offer?.gigTitle,
        description: data.offer?.description,
        deliveryDays: `${data.offer?.deliveryInDays}`,
        template: 'offer'
      };
      // send email
      await publishDirectMessage(
        channel,
        'jobber-order-notification',
        'order-email',
        JSON.stringify(emailMessageDetails),
        'Order email sent to notification service.'
      );
    }
    socketIO.emit('message received', message);
    return message;
  }
}

export const messageService: MessageService = new MessageService();
