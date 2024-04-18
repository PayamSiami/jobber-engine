import { authService } from '@jobber/services/auth.service';
import { IAuthDocument } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class Refresh {
  public async token(req: Request, res: Response): Promise<void> {
    const existingUser: IAuthDocument | undefined = await authService.getUserByUsername(req.params.username);
    const userJWT: string = authService.signToken(existingUser!.id!, existingUser!.email!, existingUser!.username!);
    res.status(StatusCodes.OK).json({ message: 'Refresh token', user: existingUser, token: userJWT });
  }
}
