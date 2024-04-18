import { authService } from '@jobber/services/auth.service';
import { BadRequestError, IAuthDocument } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class VerifyEmail {
  public async update(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const checkIfUserExist: IAuthDocument | undefined = await authService.getAuthUserByVerificationToken(token);
    if (!checkIfUserExist) {
      throw new BadRequestError('Verification token is either invalid or is already used.', 'VerifyEmail update() method error');
    }
    await authService.updateVerifyEmailField(checkIfUserExist.id!, 1);
    const updatedUser = await authService.getAuthUserById(checkIfUserExist.id!);
    res.status(StatusCodes.OK).json({ message: 'Email verified successfully.', user: updatedUser });
  }
}
