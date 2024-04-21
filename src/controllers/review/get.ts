import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { reviewService } from '@jobber/services/review.service';
import { IReviewDocument } from '@jobber/shared';

export class Get {
  public async reviewsByGigId(req: Request, res: Response): Promise<void> {
    const reviews: IReviewDocument[] = await reviewService.getReviewsByGigId(req.params.gigId);
    res.status(StatusCodes.OK).json({ message: 'Gig reviews by gig id', reviews });
  }

  public async reviewsBySellerId(req: Request, res: Response): Promise<void> {
    const reviews: IReviewDocument[] = await reviewService.getReviewsBySellerId(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: 'Gig reviews by seller id', reviews });
  }
}
