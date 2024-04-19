import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { messageService } from '@jobber/services/message.service';
import { IMessageDocument } from '@jobber/shared';

export class Update {
  public async offer(req: Request, res: Response): Promise<void> {
    const { messageId, type } = req.body;
    const message: IMessageDocument = await messageService.updateOffer(messageId, type);
    res.status(StatusCodes.OK).json({ message: 'Message updated', singleMessage: message });
  }

  public async markMultipleMessages(req: Request, res: Response): Promise<void> {
    const { messageId, senderUsername, receiverUsername } = req.body;
    await messageService.markManyMessagesAsRead(receiverUsername, senderUsername, messageId);
    res.status(StatusCodes.OK).json({ message: 'Messages marked as read' });
  }

  public async markSingleMessage(req: Request, res: Response): Promise<void> {
    const { messageId } = req.body;
    const message: IMessageDocument = await messageService.markMessageAsRead(messageId);
    res.status(StatusCodes.OK).json({ message: 'Message marked as read', singleMessage: message });
  }
}
