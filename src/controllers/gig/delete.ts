import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { gigService } from '@jobber/services/gig.service';

export class Delete {
  public async gig(req: Request, res: Response): Promise<void> {
    await gigService.deleteGig(req.params.gigId, req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: 'Gig deleted successfully.' });
  }
}
