import crypto from 'crypto';

import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { orderService } from '@jobber/services/order.service';
import Stripe from 'stripe';
import { config } from '@jobber/config';
import { orderUpdateSchema } from '@jobber/schemes/order';
import { BadRequestError, IDeliveredWork, IOrderDocument, uploads } from '@jobber/shared';
import { UploadApiResponse } from 'cloudinary';
import { setNotificationAsRead } from '@jobber/services/notification.service';

const stripe: Stripe = new Stripe(config.STRIPE_API_KEY!, {
  typescript: true
});

export class Update {
  public async cancel(req: Request, res: Response): Promise<void> {
    await stripe.refunds.create({
      payment_intent: `${req.body.paymentIntent}`
    });
    const { orderId } = req.params;
    await orderService.cancelOrder(orderId, req.body.orderData);
    res.status(StatusCodes.OK).json({ message: 'Order cancelled successfully.' });
  }

  public async requestExtension(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(orderUpdateSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Update requestExtension() method');
    }
    const { orderId } = req.params;
    const order: IOrderDocument = await orderService.requestDeliveryDateExtension(orderId, req.body);
    res.status(StatusCodes.OK).json({ message: 'Order delivery request', order });
  }

  public async deliveryDate(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(orderUpdateSchema.validate(req.body));
    if (error?.details) {
      throw new BadRequestError(error.details[0].message, 'Update deliveryDate() method');
    }
    const { orderId, type } = req.params;
    const order: IOrderDocument =
      type === 'approve' ? await orderService.approveDeliveryDate(orderId, req.body) : await orderService.rejectDeliveryDate(orderId);
    res.status(StatusCodes.OK).json({ message: 'Order delivery date extension', order });
  }

  public async deliverOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    let file: string = req.body.file;
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    let result: UploadApiResponse;
    if (file) {
      result = (req.body.fileType === 'zip' ? await uploads(file, `${randomCharacters}.zip`) : await uploads(file)) as UploadApiResponse;
      if (!result.public_id) {
        throw new BadRequestError('File upload error. Try again', 'Update deliverOrder() method');
      }
      file = result?.secure_url;
    }
    const deliveredWork: IDeliveredWork = {
      message: req.body.message,
      file,
      fileType: req.body.fileType,
      fileName: req.body.fileName,
      fileSize: req.body.fileSize
    };
    const order: IOrderDocument = await orderService.sellerDeliverOrder(orderId, true, deliveredWork);
    res.status(StatusCodes.OK).json({ message: 'Order delivered successfully.', order });
  }

  public async approveOrder(req: Request, res: Response): Promise<void> {
    const { orderId } = req.params;
    const order: IOrderDocument = await orderService.approveOrder(orderId, req.body);
    res.status(StatusCodes.OK).json({ message: 'Order approved successfully.', order });
  }

  public async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.body;
    await setNotificationAsRead(notificationId);
    res.status(StatusCodes.OK).json({ message: 'Mark notification as read.' });
  }
}
