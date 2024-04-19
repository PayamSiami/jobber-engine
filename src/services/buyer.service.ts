import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@jobber/services/axios';
import { config } from '@jobber/config';
import { IBuyerDocument } from '@jobber/shared';
import { BuyerModel } from '@jobber/models/buyer.schema';

export let axiosBuyerInstance: ReturnType<typeof axios.create>;

class BuyerService {
  constructor() {
    const axiosService: AxiosService = new AxiosService(`${config.USERS_BASE_URL}/api/v1/buyer`, 'buyer');
    axiosBuyerInstance = axiosService.axios;
  }

  async getCurrentBuyerByUsername(): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosBuyerInstance.get('/username');
    return response;
  }

  async getBuyerByUsername(username: string): Promise<IBuyerDocument | null> {
    const buyer: IBuyerDocument | null = (await BuyerModel.findOne({ username }).exec()) as IBuyerDocument;
    return buyer;
  }

  async getBuyerByEmail(email: string): Promise<IBuyerDocument | null> {
    const buyer: IBuyerDocument | null = (await BuyerModel.findOne({ email }).exec()) as IBuyerDocument;
    return buyer;
  }

  async getRandomBuyers(count: number): Promise<IBuyerDocument[]> {
    const buyers: IBuyerDocument[] = await BuyerModel.aggregate([{ $sample: { size: count } }]);
    return buyers;
  }

  async updateBuyerIsSellerProp(email: string): Promise<void> {
    await BuyerModel.updateOne(
      { email },
      {
        $set: {
          isSeller: true
        }
      }
    ).exec();
  }

  async createBuyer(buyerData: IBuyerDocument): Promise<void> {
    const checkIfBuyerExist: IBuyerDocument | null = await this.getBuyerByEmail(`${buyerData.email}`);
    if (!checkIfBuyerExist) {
      await BuyerModel.create(buyerData);
    }
  }

  async updateBuyerPurchasedGigsProp(buyerId: string, purchasedGigId: string, type: string): Promise<void> {
    await BuyerModel.updateOne(
      { _id: buyerId },
      type === 'purchased-gigs'
        ? {
            $push: {
              purchasedGigs: purchasedGigId
            }
          }
        : {
            $pull: {
              purchasedGigs: purchasedGigId
            }
          }
    ).exec();
  }
}

export const buyerService: BuyerService = new BuyerService();
