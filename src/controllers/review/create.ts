import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { IReviewDocument } from '@jobber/shared';
import { reviewService } from '@jobber/services/review.service';

export class Create {
  public async review(req: Request, res: Response): Promise<void> {
    const review: IReviewDocument = await reviewService.addReview(req.body);
    res.status(StatusCodes.CREATED).json({ message: 'Review created successfully.', review });
  }
}
