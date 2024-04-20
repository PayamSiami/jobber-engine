import { getNotificationsById } from '@jobber/services/notification.service';
import { orderService } from '@jobber/services/order.service';
import { IOrderDocument, IOrderNotifcation } from '@jobber/shared';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export class Get {
  public async orderId(req: Request, res: Response): Promise<void> {
    const order: IOrderDocument = await orderService.getOrderByOrderId(req.params.orderId);
    res.status(StatusCodes.OK).json({ message: 'Order by order id', order });
  }

  public async sellerOrders(req: Request, res: Response): Promise<void> {
    const orders: IOrderDocument[] = await orderService.getOrdersBySellerId(req.params.sellerId);
    res.status(StatusCodes.OK).json({ message: 'Seller orders', orders });
  }

  public async buyerOrders(req: Request, res: Response): Promise<void> {
    const orders: IOrderDocument[] = await orderService.getOrdersByBuyerId(req.params.buyerId);
    res.status(StatusCodes.OK).json({ message: 'Buyer orders', orders });
  }

  public async notifications(req: Request, res: Response): Promise<void> {
    const notifications: IOrderNotifcation[] = await getNotificationsById(req.params.userTo);
    res.status(StatusCodes.OK).json({ message: 'Notifications', notifications });
  }
}
