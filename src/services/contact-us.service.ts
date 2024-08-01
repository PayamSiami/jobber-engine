import axios from 'axios';
import { config } from '@jobber/config';
import { IContactUsDocument, winstonLogger } from '@jobber/shared';
import { Model } from 'sequelize';
import { omit } from 'lodash';
import { Logger } from 'winston';
import { ContactUsModel } from '@jobber/models/contact-us.schema';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'contactUsService', 'debug');
export let axiosAuthInstance: ReturnType<typeof axios.create>;

class ContactUsService {
  async createContactUs(data: IContactUsDocument): Promise<IContactUsDocument | undefined> {
    try {
      const result: Model = await ContactUsModel.create(data);
      // const userData: IContactUsDocument = omit(result.dataValues, ['password']) as IAuthDocument;
      const userData: IContactUsDocument = omit(result.dataValues, ['password']) as IContactUsDocument;
      return userData;
    } catch (error) {
      log.error(error);
    }
  }
}

export const contactUsService: ContactUsService = new ContactUsService();
