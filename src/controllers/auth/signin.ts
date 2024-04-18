import { AuthModel } from '@jobber/models/auth.schema';
import { loginSchema } from '@jobber/schemes/signin';
import { authService } from '@jobber/services/auth.service';
import { BadRequestError, IAuthDocument, isEmail } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { omit } from 'lodash';

export class SignIn {
  public async read(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(loginSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'SignIn read() method error');
    }
    const { username, password } = req.body;
    const isValidEmail: boolean = isEmail(username);
    const existingUser: IAuthDocument | undefined = !isValidEmail
      ? await authService.getUserByUsername(username)
      : await authService.getUserByEmail(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
    }
    const passwordsMatch: boolean = await AuthModel.prototype.comparePassword(password, existingUser.password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials', 'SignIn read() method error');
    }
    const userJWT: string = authService.signToken(existingUser.id!, existingUser.email!, existingUser.username!);
    const userData: IAuthDocument = omit(existingUser, ['password']);
    res.status(StatusCodes.OK).json({ message: 'User login successfully', user: userData, token: userJWT });
  }
}
