import { BadRequestError, IContactUsDocument, firstLetterUppercase, lowerCase } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ContactUsSchema } from '@jobber/schemes/contact-us';
import { contactUsService } from '@jobber/services/contact-us.service';

export class Contact {
  public async create(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(ContactUsSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'contact create() method error');
    }
    const { title, email, description } = req.body;
    const contactUsData: IContactUsDocument = {
      title: firstLetterUppercase(title),
      email: lowerCase(email),
      description
    } as IContactUsDocument;

    const result: IContactUsDocument = (await contactUsService.createContactUs(contactUsData)) as IContactUsDocument;
    res.status(StatusCodes.CREATED).json({ message: 'contact created successfully', contact: result });
  }
}
