import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { sellerService } from '@jobber/services/seller.service';
import { ISellerDocument } from '@jobber/shared';

export class Get {
  public async id(req: Request, res: Response): Promise<void> {
    const seller: ISellerDocument | null = await sellerService.getSellerById(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: 'Seller profile', seller });
  }

  public async username(req: Request, res: Response): Promise<void> {
    const seller: ISellerDocument | null = await sellerService.getSellerByUsername(req.params.username);
    res.status(StatusCodes.OK).json({ message: 'Seller profile', seller });
  }

  public async random(req: Request, res: Response): Promise<void> {
    const sellers: ISellerDocument[] = await sellerService.getRandomSellers(parseInt(req.params.size, 10));
    res.status(StatusCodes.OK).json({ message: 'Random sellers profile', sellers });
  }
}
