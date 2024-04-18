import crypto from 'crypto';

import { changePasswordSchema, emailSchema, passwordSchema } from '@jobber/schemes/password';
import { BadRequestError, IAuthDocument, IEmailMessageDetails } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '@jobber/config';
import { channel } from '@jobber/server';
import { AuthModel } from '@jobber/models/auth.schema';
import { publishDirectMessage } from '@jobber/queues/auth.producer';
import { authService } from '@jobber/services/auth.service';

export class Password {
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(emailSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Password forgotPassword() method error');
    }
    const { email } = req.body;
    const existingUser: IAuthDocument | undefined = await authService.getUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials', 'Password forgotPassword() method error');
    }
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const date: Date = new Date();
    date.setHours(date.getHours() + 1);
    await authService.updatePasswordToken(existingUser.id!, randomCharacters, date);
    const resetLink = `${config.CLIENT_URL}/reset_password?token=${randomCharacters}`;
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: existingUser.email,
      resetLink,
      username: existingUser.username,
      template: 'forgotPassword'
    };
    await publishDirectMessage(
      channel,
      'jobber-email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Forgot password message sent to notification service.'
    );
    res.status(StatusCodes.OK).json({ message: 'Password reset email sent.' });
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(passwordSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Password resetPassword() method error');
    }
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match', 'Password resetPassword() method error');
    }

    const existingUser: IAuthDocument | undefined = await authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Reset token has expired', 'Password resetPassword() method error');
    }
    const hashedPassword: string = await AuthModel.prototype.hashPassword(password);
    await authService.updatePassword(existingUser.id!, hashedPassword);
    const messageDetails: IEmailMessageDetails = {
      username: existingUser.username,
      template: 'resetPasswordSuccess'
    };
    await publishDirectMessage(
      channel,
      'jobber-email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Reset password success message sent to notification service.'
    );
    res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(changePasswordSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Password changePassword() method error');
    }
    const { newPassword } = req.body;

    const existingUser: IAuthDocument | undefined = await authService.getUserByUsername(`${req.currentUser?.username}`);
    if (!existingUser) {
      throw new BadRequestError('Invalid password', 'Password changePassword() method error');
    }
    const hashedPassword: string = await AuthModel.prototype.hashPassword(newPassword);
    await authService.updatePassword(existingUser.id!, hashedPassword);
    const messageDetails: IEmailMessageDetails = {
      username: existingUser.username,
      template: 'resetPasswordSuccess'
    };
    await publishDirectMessage(
      channel,
      'jobber-email-notification',
      'auth-email',
      JSON.stringify(messageDetails),
      'Password change success message sent to notification service.'
    );
    res.status(StatusCodes.OK).json({ message: 'Password successfully updated.' });
  }
}
