import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { sellerSchema } from '@jobber/schemes/seller';
import { BadRequestError, ISellerDocument } from '@jobber/shared';
import { sellerService } from '@jobber/services/seller.service';

export class Update {
  public async seller(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(sellerSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Update seller() method error');
    }
    const seller: ISellerDocument = {
      profilePublicId: req.body.profilePublicId,
      fullName: req.body.fullName,
      profilePicture: req.body.profilePicture,
      description: req.body.description,
      oneliner: req.body.oneliner,
      country: req.body.country,
      skills: req.body.skills,
      languages: req.body.languages,
      responseTime: req.body.responseTime,
      experience: req.body.experience,
      education: req.body.education,
      socialLinks: req.body.socialLinks,
      certificates: req.body.certificates
    };
    const updatedSeller: ISellerDocument = await sellerService.updateSeller(req.params.sellerId, seller);
    res.status(StatusCodes.OK).json({ message: 'Seller created successfully.', seller: updatedSeller });
  }
}
