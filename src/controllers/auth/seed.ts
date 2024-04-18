import crypto from 'crypto';

import { faker } from '@faker-js/faker';
import { authService } from '@jobber/services/auth.service';
import { BadRequestError, IAuthDocument, firstLetterUppercase, lowerCase } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { generateUsername } from 'unique-username-generator';
import { v4 as uuidV4 } from 'uuid';
import { sample } from 'lodash';

export class AuthSeed {
  public async create(req: Request, res: Response): Promise<void> {
    const { count } = req.params;
    const usernames: string[] = [];
    for (let i = 0; i < parseInt(count, 10); i++) {
      const username: string = generateUsername('', 0, 12);
      usernames.push(firstLetterUppercase(username));
    }

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const email = faker.internet.email();
      const password = 'qwerty';
      const country = faker.location.country();
      const profilePicture = faker.image.urlPicsumPhotos();
      const checkIfUserExist: IAuthDocument | undefined = await authService.getUserByUsernameOrEmail(username, email);
      if (checkIfUserExist) {
        throw new BadRequestError('Invalid credentials. Email or Username', 'Seed create() method error');
      }
      const profilePublicId = uuidV4();
      const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
      const randomCharacters: string = randomBytes.toString('hex');
      const authData: IAuthDocument = {
        username: firstLetterUppercase(username),
        email: lowerCase(email),
        profilePublicId,
        password,
        country,
        profilePicture,
        emailVerificationToken: randomCharacters,
        emailVerified: sample([0, 1])
      } as IAuthDocument;
      await authService.createAuthUser(authData);
    }
    res.status(StatusCodes.OK).json({ message: 'Seed users created successfully.' });
  }
}
