import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { messageService } from '@jobber/services/message.service';
import { IConversationDocument, IMessageDocument } from '@jobber/shared';

export class Get {
  public async conversation(req: Request, res: Response): Promise<void> {
    const { senderUsername, receiverUsername } = req.params;
    const conversations: IConversationDocument[] = await messageService.getConversation(senderUsername, receiverUsername);
    res.status(StatusCodes.OK).json({ message: 'Chat conversation', conversations });
  }

  public async messages(req: Request, res: Response): Promise<void> {
    const { senderUsername, receiverUsername } = req.params;
    const messages: IMessageDocument[] = await messageService.getMessages(senderUsername, receiverUsername);
    res.status(StatusCodes.OK).json({ message: 'Chat messages', messages });
  }

  public async conversationList(req: Request, res: Response): Promise<void> {
    const { username } = req.params;
    const messages: IMessageDocument[] = await messageService.getUserConversationList(username);
    res.status(StatusCodes.OK).json({ message: 'Conversation list', conversations: messages });
  }

  public async userMessages(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params;
    const messages: IMessageDocument[] = await messageService.getUserMessages(conversationId);
    res.status(StatusCodes.OK).json({ message: 'Chat messages', messages });
  }
}
