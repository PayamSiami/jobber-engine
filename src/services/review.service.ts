import { IReviewDocument, IReviewMessageDetails } from '@jobber/shared';
import { QueryResult } from 'pg';
import { postgresqlDatabase } from '@jobber/postgresql.database';
import { map } from 'lodash';
import { publishFanoutMessage } from '@jobber/queues/review.producer';
import { channel } from '@jobber/server';

interface IReviewerObjectKeys {
  [key: string]: string | number | Date | undefined;
}

const objKeys: IReviewerObjectKeys = {
  review: 'review',
  rating: 'rating',
  country: 'country',
  gigid: 'gigId',
  reviewerid: 'reviewerId',
  createdat: 'createdAt',
  orderid: 'orderId',
  sellerid: 'sellerId',
  reviewerimage: 'reviewerImage',
  reviewerusername: 'reviewerUsername',
  reviewtype: 'reviewType'
};

class ReviewService {
  async getReviewsByGigId(gigId: string): Promise<IReviewDocument[]> {
    const reviews: QueryResult = await postgresqlDatabase.pool.query('SELECT * FROM reviews WHERE reviews.gigId = $1', [gigId]);
    const mappedResult: IReviewDocument[] = map(reviews.rows, (key) => {
      return Object.fromEntries(Object.entries(key).map(([key, value]) => [objKeys[key] || key, value]));
    });
    return mappedResult;
  }

  async getReviewsBySellerId(sellerId: string): Promise<IReviewDocument[]> {
    const reviews: QueryResult = await postgresqlDatabase.pool.query(
      'SELECT * FROM reviews WHERE reviews.sellerId = $1 AND reviews.reviewType = $2',
      [sellerId, 'seller-review']
    );
    const mappedResult: IReviewDocument[] = map(reviews.rows, (key) => {
      return Object.fromEntries(Object.entries(key).map(([key, value]) => [objKeys[key] || key, value]));
    });
    return mappedResult;
  }

  async addReview(data: IReviewDocument): Promise<IReviewDocument> {
    const { gigId, reviewerId, reviewerImage, sellerId, review, rating, orderId, reviewType, reviewerUsername, country } = data;
    const createdAtDate = new Date();
    const { rows } = await postgresqlDatabase.pool.query(
      `INSERT INTO reviews(gigId, reviewerId, reviewerImage, sellerId, review, rating, orderId, reviewType, reviewerUsername, country, createdAt)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [gigId, reviewerId, reviewerImage, sellerId, review, rating, orderId, reviewType, reviewerUsername, country, createdAtDate]
    );
    const messageDetails: IReviewMessageDetails = {
      gigId: data.gigId,
      reviewerId: data.reviewerId,
      sellerId: data.sellerId,
      review: data.review,
      rating: data.rating,
      orderId: data.orderId,
      createdAt: `${createdAtDate}`,
      type: `${reviewType}`
    };
    await publishFanoutMessage(channel, 'jobber-review', JSON.stringify(messageDetails), 'Review details sent to order and users services');
    const result: IReviewDocument = Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [objKeys[key] || key, value]));
    return result;
  }
}

export const reviewService: ReviewService = new ReviewService();
