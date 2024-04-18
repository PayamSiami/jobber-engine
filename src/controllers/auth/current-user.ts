import crypto from 'crypto';

import { GatewayCache } from '@jobber/redis/gateway.cache';
import { channel, socketIO } from '@jobber/server';
import { authService } from '@jobber/services/auth.service';
import { BadRequestError, IAuthDocument, IEmailMessageDetails, lowerCase } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '@jobber/config';
import { publishDirectMessage } from '@jobber/queues/auth.producer';

const gatewayCache: GatewayCache = new GatewayCache();
export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let user = null;
    const existingUser: IAuthDocument | undefined = await authService.getAuthUserById(req.currentUser!.id);
    if (Object.keys(existingUser!).length) {
      user = existingUser;
    }
    res.status(StatusCodes.OK).json({ message: 'Authenticated user', user });
  }

  public async resendEmail(req: Request, res: Response): Promise<void> {
    const { email, userId } = req.body;
    const checkIfUserExist: IAuthDocument | undefined = await authService.getUserByEmail(lowerCase(email));
    if (!checkIfUserExist) {
      throw new BadRequestError('Email is invalid', 'CurrentUser resentEmail() method error');
    }
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${randomCharacters}`;
    await authService.updateVerifyEmailField(parseInt(userId), 0, randomCharacters);
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: lowerCase(email),
      verifyLink: verificationLink,
      template: 'verifyEmail'
    };
    await publishDirectMessage(
      channel,
      'jobber-email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Verify email message has been sent to notification service.'
    );
    const updatedUser = await authService.getAuthUserById(parseInt(userId));
    res.status(StatusCodes.OK).json({ message: 'Email verification sent', user: updatedUser });
  }

  public async getLoggedInUsers(_req: Request, res: Response): Promise<void> {
    const response: string[] = await gatewayCache.getLoggedInUsersFromCache('loggedInUsers');
    socketIO.emit('online', response);
    res.status(StatusCodes.OK).json({ message: 'User is online' });
  }

  public async removeLoggedInUser(req: Request, res: Response): Promise<void> {
    const response: string[] = await gatewayCache.removeLoggedInUserFromCache('loggedInUsers', req.params.username);
    socketIO.emit('online', response);
    res.status(StatusCodes.OK).json({ message: 'User is offline' });
  }
}
