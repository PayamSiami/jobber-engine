import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@jobber/services/axios';
import { config } from '@jobber/config';
import {
  IAuth,
  IAuthBuyerMessageDetails,
  IAuthDocument,
  IHitsTotal,
  IPaginateProps,
  IQueryList,
  ISearchResult,
  firstLetterUppercase,
  lowerCase,
  winstonLogger
} from '@jobber/shared';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { elasticSearch } from '@jobber/elasticsearch';
import { Model, Op } from 'sequelize';
import { AuthModel } from '@jobber/models/auth.schema';
import { publishDirectMessage } from '@jobber/queues/auth.producer';
import { channel } from '@jobber/server';
import { omit } from 'lodash';
import { Logger } from 'winston';
import { sign } from 'jsonwebtoken';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'authService', 'debug');
export let axiosAuthInstance: ReturnType<typeof axios.create>;

class AuthService {
  axiosService: AxiosService;

  constructor() {
    this.axiosService = new AxiosService(`${config.AUTH_BASE_URL}/api/v1/auth`, 'auth');
    axiosAuthInstance = this.axiosService.axios;
  }

  async gigsSearch(
    searchQuery: string,
    paginate: IPaginateProps,
    deliveryTime?: string,
    min?: number,
    max?: number
  ): Promise<ISearchResult> {
    const { from, size, type } = paginate;
    const queryList: IQueryList[] = [
      {
        query_string: {
          fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'tags'],
          query: `*${searchQuery}*`
        }
      },
      {
        term: {
          active: true
        }
      }
    ];

    if (deliveryTime !== 'undefined') {
      queryList.push({
        query_string: {
          fields: ['expectedDelivery'],
          query: `*${deliveryTime}*`
        }
      });
    }

    if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
      queryList.push({
        range: {
          price: {
            gte: min,
            lte: max
          }
        }
      });
    }
    const result: SearchResponse = await elasticSearch.elasticSearchClient.search({
      index: 'gigs',
      size,
      query: {
        bool: {
          must: [...queryList]
        }
      },
      sort: [
        {
          sortId: type === 'forward' ? 'asc' : 'desc'
        }
      ],
      ...(from !== '0' && { search_after: [from] })
    });
    const total: IHitsTotal = result.hits.total as IHitsTotal;
    return {
      total: total.value,
      hits: result.hits.hits
    };
  }

  async getCurrentUser(): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.get('/currentuser');
    return response;
  }

  async getRefreshToken(username: string): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: { username: firstLetterUppercase(username) }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.put('/change-password', { currentPassword, newPassword });
    return response;
  }

  async verifyEmail(token: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.put('/verify-email', { token });
    return response;
  }

  async resendEmail(data: { userId: number; email: string }): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.post('/resend-email', data);
    return response;
  }

  async signUp(body: IAuth): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.post('/signup', body);
    return response;
  }

  async signIn(body: IAuth): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.post('/signin', body);
    return response;
  }

  async forgotPassword(email: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.put('/forgot-password', { email });
    return response;
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.put(`/reset-password/${token}`, { password, confirmPassword });
    return response;
  }

  async getGigs(from: string, size: string, type: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.get(`/search/gig/${from}/${size}/${type}}`);
    return response;
  }

  async getGig(gigId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.get(`/search/gig/${gigId}`);
    return response;
  }

  async seed(count: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.put(`/seed/${count}`);
    return response;
  }

  async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: {
          [Op.or]: [{ username: firstLetterUppercase(username) }, { email: lowerCase(email) }]
        }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }

  signToken(id: number, email: string, username: string): string {
    return sign(
      {
        id,
        email,
        username
      },
      config.JWT_TOKEN!
    );
  }

  async getUserByUsername(username: string): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: { username: firstLetterUppercase(username) }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }

  async updateVerifyEmailField(authId: number, emailVerified: number, emailVerificationToken?: string): Promise<void> {
    try {
      await AuthModel.update(
        !emailVerificationToken
          ? {
              emailVerified
            }
          : {
              emailVerified,
              emailVerificationToken
            },
        { where: { id: authId } }
      );
    } catch (error) {
      log.error(error);
    }
  }

  async getAuthUserById(authId: number): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: { id: authId },
        attributes: {
          exclude: ['password']
        }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }

  async getUserByEmail(email: string): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: { email: lowerCase(email) }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }

  async getAuthUserByVerificationToken(token: string): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: { emailVerificationToken: token },
        attributes: {
          exclude: ['password']
        }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }

  async updatePasswordToken(authId: number, token: string, tokenExpiration: Date): Promise<void> {
    try {
      await AuthModel.update(
        {
          passwordResetToken: token,
          passwordResetExpires: tokenExpiration
        },
        { where: { id: authId } }
      );
    } catch (error) {
      log.error(error);
    }
  }

  async updatePassword(authId: number, password: string): Promise<void> {
    try {
      await AuthModel.update(
        {
          password,
          passwordResetToken: '',
          passwordResetExpires: new Date()
        },
        { where: { id: authId } }
      );
    } catch (error) {
      log.error(error);
    }
  }

  async createAuthUser(data: IAuthDocument): Promise<IAuthDocument | undefined> {
    try {
      const result: Model = await AuthModel.create(data);
      const messageDetails: IAuthBuyerMessageDetails = {
        username: result.dataValues.username!,
        email: result.dataValues.email!,
        profilePicture: result.dataValues.profilePicture!,
        country: result.dataValues.country!,
        createdAt: result.dataValues.createdAt!,
        type: 'auth'
      };
      await publishDirectMessage(
        channel,
        'jobber-buyer-update',
        'user-buyer',
        JSON.stringify(messageDetails),
        'Buyer details sent to buyer service.'
      );
      const userData: IAuthDocument = omit(result.dataValues, ['password']) as IAuthDocument;
      return userData;
    } catch (error) {
      log.error(error);
    }
  }

  async getAuthUserByPasswordToken(token: string): Promise<IAuthDocument | undefined> {
    try {
      const user: Model = (await AuthModel.findOne({
        where: {
          [Op.and]: [{ passwordResetToken: token }, { passwordResetExpires: { [Op.gt]: new Date() } }]
        }
      })) as Model;
      return user?.dataValues;
    } catch (error) {
      log.error(error);
    }
  }
}

export const authService: AuthService = new AuthService();
