import { buyerService } from '@jobber/services/buyer.service';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { IBuyerDocument } from '@jobber/shared';

export class Get {
  public async email(req: Request, res: Response): Promise<void> {
    const buyer: IBuyerDocument | null = await buyerService.getBuyerByEmail(req.currentUser!.email);
    res.status(StatusCodes.OK).json({ message: 'Buyer profile', buyer });
  }

  public async currentUsername(req: Request, res: Response): Promise<void> {
    const buyer: IBuyerDocument | null = await buyerService.getBuyerByUsername(req.currentUser!.username);
    res.status(StatusCodes.OK).json({ message: 'Buyer profile', buyer });
  }

  public async username(req: Request, res: Response): Promise<void> {
    const buyer: IBuyerDocument | null = await buyerService.getBuyerByUsername(req.params.username);
    res.status(StatusCodes.OK).json({ message: 'Buyer profile', buyer });
  }
}
