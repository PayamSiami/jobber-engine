import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { publishDirectMessage } from '@jobber/queues/auth.producer';
import { channel } from '@jobber/server';

export class GigSeed {
  public async gig(req: Request, res: Response): Promise<void> {
    const { count } = req.params;
    await publishDirectMessage(
      channel,
      'jobber-gig',
      'get-sellers',
      JSON.stringify({ type: 'getSellers', count }),
      'Gig seed message sent to user service.'
    );
    res.status(StatusCodes.CREATED).json({ message: 'Gig created successfully' });
  }
}
