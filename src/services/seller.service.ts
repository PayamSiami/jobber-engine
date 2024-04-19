import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@jobber/services/axios';
import { config } from '@jobber/config';
import { IOrderMessage, IRatingTypes, IReviewMessageDetails, ISellerDocument } from '@jobber/shared';
import { SellerModel } from '@jobber/models/seller.schema';
import mongoose from 'mongoose';

import { buyerService } from './buyer.service';

export let axiosSellerInstance: ReturnType<typeof axios.create>;

class SellerService {
  constructor() {
    const axiosService: AxiosService = new AxiosService(`${config.USERS_BASE_URL}/api/v1/seller`, 'seller');
    axiosSellerInstance = axiosService.axios;
  }

  async getSellerById(sellerId: string): Promise<ISellerDocument | null> {
    const seller: ISellerDocument | null = (await SellerModel.findOne({
      _id: new mongoose.Types.ObjectId(sellerId)
    }).exec()) as ISellerDocument;
    return seller;
  }

  async getSellerByUsername(username: string): Promise<ISellerDocument | null> {
    const seller: ISellerDocument | null = (await SellerModel.findOne({ username }).exec()) as ISellerDocument;
    return seller;
  }

  async getRandomSellers(size: number): Promise<ISellerDocument[]> {
    const sellers: ISellerDocument[] = await SellerModel.aggregate([{ $sample: { size } }]);
    return sellers;
  }

  async createSeller(sellerData: ISellerDocument): Promise<ISellerDocument> {
    const createdSeller: ISellerDocument = (await SellerModel.create(sellerData)) as ISellerDocument;
    await buyerService.updateBuyerIsSellerProp(`${createdSeller.email}`);
    return createdSeller;
  }

  async updateSeller(sellerId: string, sellerData: ISellerDocument): Promise<ISellerDocument> {
    const updatedSeller: ISellerDocument = (await SellerModel.findOneAndUpdate(
      { _id: sellerId },
      {
        $set: {
          profilePublicId: sellerData.profilePublicId,
          fullName: sellerData.fullName,
          profilePicture: sellerData.profilePicture,
          description: sellerData.description,
          country: sellerData.country,
          skills: sellerData.skills,
          oneliner: sellerData.oneliner,
          languages: sellerData.languages,
          responseTime: sellerData.responseTime,
          experience: sellerData.experience,
          education: sellerData.education,
          socialLinks: sellerData.socialLinks,
          certificates: sellerData.certificates
        }
      },
      { new: true }
    ).exec()) as ISellerDocument;
    return updatedSeller;
  }

  async seed(count: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosSellerInstance.put(`/seed/${count}`);
    return response;
  }

  async getSellerByEmail(email: string): Promise<ISellerDocument | null> {
    const seller: ISellerDocument | null = (await SellerModel.findOne({ email }).exec()) as ISellerDocument;
    return seller;
  }

  async updateSellerOngoingJobsProp(sellerId: string, ongoingJobs: number): Promise<void> {
    await SellerModel.updateOne({ _id: sellerId }, { $inc: { ongoingJobs } }).exec();
  }

  async updateSellerCompletedJobsProp(data: IOrderMessage): Promise<void> {
    const { sellerId, ongoingJobs, completedJobs, totalEarnings, recentDelivery } = data;
    await SellerModel.updateOne(
      { _id: sellerId },
      {
        $inc: {
          ongoingJobs,
          completedJobs,
          totalEarnings
        },
        $set: { recentDelivery: new Date(recentDelivery!) }
      }
    ).exec();
  }

  async updateSellerCancelledJobsProp(sellerId: string): Promise<void> {
    await SellerModel.updateOne({ _id: sellerId }, { $inc: { ongoingJobs: -1, cancelledJobs: 1 } }).exec();
  }

  async updateTotalGigsCount(sellerId: string, count: number): Promise<void> {
    await SellerModel.updateOne({ _id: sellerId }, { $inc: { totalGigs: count } }).exec();
  }

  async updateSellerReview(data: IReviewMessageDetails): Promise<void> {
    const ratingTypes: IRatingTypes = {
      '1': 'one',
      '2': 'two',
      '3': 'three',
      '4': 'four',
      '5': 'five'
    };
    const ratingKey: string = ratingTypes[`${data.rating}`];
    await SellerModel.updateOne(
      { _id: data.sellerId },
      {
        $inc: {
          ratingsCount: 1,
          ratingSum: data.rating,
          [`ratingCategories.${ratingKey}.value`]: data.rating,
          [`ratingCategories.${ratingKey}.count`]: 1
        }
      }
    ).exec();
  }
}

export const sellerService: SellerService = new SellerService();
