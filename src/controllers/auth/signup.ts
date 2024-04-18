import crypto from 'crypto';

import { config } from '@jobber/config';
import { signupSchema } from '@jobber/schemes/signup';
import { BadRequestError, IAuthDocument, IEmailMessageDetails, firstLetterUppercase, uploads } from '@jobber/shared';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { lowerCase } from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { channel } from '@jobber/server';
import { publishDirectMessage } from '@jobber/queues/auth.producer';
import { authService } from '@jobber/services/auth.service';

export class SignUp {
  public async create(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(signupSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'SignUp create() method error');
    }
    const { username, email, password, country, profilePicture } = req.body;
    const checkIfUserExist: IAuthDocument | undefined = await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials. Email or Username', 'SignUp create() method error');
    }

    const profilePublicId = uuidV4();
    const uploadResult: UploadApiResponse = (await uploads(profilePicture, `${profilePublicId}`, true, true)) as UploadApiResponse;
    if (!uploadResult.public_id) {
      throw new BadRequestError('File upload error. Try again', 'SignUp create() method error');
    }
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    const authData: IAuthDocument = {
      username: firstLetterUppercase(username),
      email: lowerCase(email),
      profilePublicId,
      password,
      country,
      profilePicture: uploadResult?.secure_url,
      emailVerificationToken: randomCharacters
    } as IAuthDocument;

    const result: IAuthDocument = (await authService.createAuthUser(authData)) as IAuthDocument;
    const verificationLink = `${config.CLIENT_URL}/confirm_email?v_token=${authData.emailVerificationToken}`;
    const messageDetails: IEmailMessageDetails = {
      receiverEmail: result.email,
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
    const userJWT: string = authService.signToken(result.id!, result.email!, result.username!);
    res.status(StatusCodes.CREATED).json({ message: 'User created successfully', user: result, token: userJWT });
  }
}
