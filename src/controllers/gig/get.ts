import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { gigService } from '@jobber/services/gig.service';
import { ISearchResult, ISellerGig } from '@jobber/shared';
import { gatewayCache } from '@jobber/redis/gateway.cache';
import { getMoreGigsLikeThis, getTopRatedGigsByCategory, gigsSearchByCategory } from '@jobber/services/search.service';

export class Get {
  public async gigById(req: Request, res: Response): Promise<void> {
    const gig: ISellerGig = await gigService.getGigById(req.params.gigId);
    res.status(StatusCodes.OK).json({ message: 'Get gig by id', gig });
  }

  async getSellerGigs(req: Request, res: Response): Promise<void> {
    const gigs: ISellerGig[] = await gigService.getSellerGigs(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: 'Seller gigs', gigs });
  }

  public async getSellerPausedGigs(req: Request, res: Response): Promise<void> {
    const gigs: ISellerGig[] = await gigService.getSellerPausedGigs(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: 'Seller gigs', gigs });
  }

  public async getGigsByCategory(req: Request, res: Response): Promise<void> {
    const category = await gatewayCache.getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
    const resultHits: ISellerGig[] = [];
    const gigs: ISearchResult = await gigsSearchByCategory(`${category}`);
    for (const item of gigs.hits) {
      resultHits.push(item._source as ISellerGig);
    }
    res.status(StatusCodes.OK).json({ message: 'Search gigs category results', total: gigs.total, gigs: resultHits });
  }

  public async moreGigsLikeThis(req: Request, res: Response): Promise<void> {
    const resultHits: ISellerGig[] = [];
    const gigs: ISearchResult = await getMoreGigsLikeThis(req.params.gigId);
    for(const item of gigs.hits) {
      resultHits.push(item._source as ISellerGig);
    }
    res.status(StatusCodes.OK).json({ message: 'More gigs like this result', total: gigs.total, gigs: resultHits });
  }

  public async topRatedGigsByCategory(req: Request, res: Response): Promise<void> {
    const category = await gatewayCache.getUserSelectedGigCategory(`selectedCategories:${req.params.username}`);
    const resultHits: ISellerGig[] = [];
    const gigs: ISearchResult = await getTopRatedGigsByCategory(`${category}`);
    for (const item of gigs.hits) {
      resultHits.push(item._source as ISellerGig);
    }
    res.status(StatusCodes.OK).json({ message: 'Search top gigs results', total: gigs.total, gigs: resultHits });
  }
}
