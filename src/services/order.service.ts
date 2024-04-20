import { OrderModel } from '@jobber/models/order.schema';
import { AxiosService } from '@jobber/services/axios';
import { IOrderDocument, IExtendedDelivery, IDeliveredWork, IOrderMessage, IReviewMessageDetails, lowerCase } from '@jobber/shared';
import axios, { AxiosResponse } from 'axios';
import { publishDirectMessage } from '@jobber/queues/auth.producer';
import { channel } from '@jobber/server';
import { config } from '@jobber/config';

import { sendNotification } from './notification.service';

export let axiosOrderInstance: ReturnType<typeof axios.create>;

class OrderService {
  constructor() {
    const axiosService: AxiosService = new AxiosService(`${process.env.ORDER_BASE_URL}/api/v1/order`, 'order');
    axiosOrderInstance = axiosService.axios;
  }

  public async getOrderById(orderId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.get(`/${orderId}`);
    return response;
  }

  public async getOrderByOrderId(orderId: string): Promise<IOrderDocument> {
    const order: IOrderDocument[] = (await OrderModel.aggregate([{ $match: { orderId } }])) as IOrderDocument[];
    return order[0];
  }

  public async getOrdersByBuyerId(buyerId: string): Promise<IOrderDocument[]> {
    const orders: IOrderDocument[] = (await OrderModel.aggregate([{ $match: { buyerId } }])) as IOrderDocument[];
    return orders;
  }

  public async getOrdersBySellerId(sellerId: string): Promise<IOrderDocument[]> {
    const orders: IOrderDocument[] = (await OrderModel.aggregate([{ $match: { sellerId } }])) as IOrderDocument[];
    return orders;
  }

  public async updateOrderReview(data: IReviewMessageDetails): Promise<IOrderDocument> {
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId: data.orderId },
      {
        $set:
          data.type === 'buyer-review'
            ? {
                buyerReview: {
                  rating: data.rating,
                  review: data.review,
                  created: new Date(`${data.createdAt}`)
                },
                ['events.buyerReview']: new Date(`${data.createdAt}`)
              }
            : {
                sellerReview: {
                  rating: data.rating,
                  review: data.review,
                  created: new Date(`${data.createdAt}`)
                },
                ['events.sellerReview']: new Date(`${data.createdAt}`)
              }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    sendNotification(
      order,
      data.type === 'buyer-review' ? order.sellerUsername : order.buyerUsername,
      `left you a ${data.rating} star review`
    );
    return order;
  }

  async sellerOrders(sellerId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.get(`/seller/${sellerId}`);
    return response;
  }

  async buyerOrders(buyerId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.get(`/buyer/${buyerId}`);
    return response;
  }

  async createOrderIntent(price: number, buyerId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.post('/create-payment-intent', { price, buyerId });
    return response;
  }

  async createOrder(data: IOrderDocument): Promise<IOrderDocument> {
    const order: IOrderDocument = await OrderModel.create(data);
    const messageDetails: IOrderMessage = {
      sellerId: data.sellerId,
      ongoingJobs: 1,
      type: 'create-order'
    };
    // update seller info
    await publishDirectMessage(
      channel,
      'jobber-seller-update',
      'user-seller',
      JSON.stringify(messageDetails),
      'Details sent to users service'
    );
    const emailMessageDetails: IOrderMessage = {
      orderId: data.orderId,
      invoiceId: data.invoiceId,
      orderDue: `${data.offer.newDeliveryDate}`,
      amount: `${data.price}`,
      buyerUsername: lowerCase(data.buyerUsername),
      sellerUsername: lowerCase(data.sellerUsername),
      title: data.offer.gigTitle,
      description: data.offer.description,
      requirements: data.requirements,
      serviceFee: `${order.serviceFee}`,
      total: `${order.price + order.serviceFee!}`,
      orderUrl: `${config.CLIENT_URL}/orders/${data.orderId}/activities`,
      template: 'orderPlaced'
    };
    // send email
    await publishDirectMessage(
      channel,
      'jobber-order-notification',
      'order-email',
      JSON.stringify(emailMessageDetails),
      'Order email sent to notification service.'
    );
    sendNotification(order, data.sellerUsername, 'placed an order for your gig.');
    return order;
  }

  async cancelOrder(orderId: string, data: IOrderMessage): Promise<IOrderDocument> {
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          cancelled: true,
          status: 'Cancelled',
          approvedAt: new Date()
        }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    // update seller info
    await publishDirectMessage(
      channel,
      'jobber-seller-update',
      'user-seller',
      JSON.stringify({ type: 'cancel-order', sellerId: data.sellerId }),
      'Cancelled order details sent to users service.'
    );
    // update buyer info
    await publishDirectMessage(
      channel,
      'jobber-buyer-update',
      'user-buyer',
      JSON.stringify({ type: 'cancel-order', buyerId: data.buyerId, purchasedGigs: data.purchasedGigs }),
      'Cancelled order details sent to users service.'
    );
    sendNotification(order, order.sellerUsername, 'cancelled your order delivery.');
    return order;
  }

  public async sellerDeliverOrder(orderId: string, delivered: boolean, deliveredWork: IDeliveredWork): Promise<IOrderDocument> {
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          delivered,
          status: 'Delivered',
          ['events.orderDelivered']: new Date()
        },
        $push: {
          deliveredWork
        }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    if (order) {
      const messageDetails: IOrderMessage = {
        orderId,
        buyerUsername: lowerCase(order.buyerUsername),
        sellerUsername: lowerCase(order.sellerUsername),
        title: order.offer.gigTitle,
        description: order.offer.description,
        orderUrl: `${config.CLIENT_URL}/orders/${orderId}/activities`,
        template: 'orderDelivered'
      };
      // send email
      await publishDirectMessage(
        channel,
        'jobber-order-notification',
        'order-email',
        JSON.stringify(messageDetails),
        'Order delivered message sent to notification service.'
      );
      sendNotification(order, order.buyerUsername, 'delivered your order.');
    }
    return order;
  }

  async requestDeliveryDateExtension(orderId: string, data: IExtendedDelivery): Promise<IOrderDocument> {
    const { newDate, days, reason, originalDate } = data;
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          ['requestExtension.originalDate']: originalDate,
          ['requestExtension.newDate']: newDate,
          ['requestExtension.days']: days,
          ['requestExtension.reason']: reason
        }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    if (order) {
      const messageDetails: IOrderMessage = {
        buyerUsername: lowerCase(order.buyerUsername),
        sellerUsername: lowerCase(order.sellerUsername),
        originalDate: order.offer.oldDeliveryDate,
        newDate: order.offer.newDeliveryDate,
        reason: order.offer.reason,
        orderUrl: `${config.CLIENT_URL}/orders/${orderId}/activities`,
        template: 'orderExtension'
      };
      // send email
      await publishDirectMessage(
        channel,
        'jobber-order-notification',
        'order-email',
        JSON.stringify(messageDetails),
        'Order delivered message sent to notification service.'
      );
      sendNotification(order, order.buyerUsername, 'requested for an order delivery date extension.');
    }
    return order;
  }

  async updateDeliveryDate(orderId: string, type: string, body: IExtendedDelivery): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.put(`/gig/${type}/${orderId}`, body);
    return response;
  }

  async deliverOrder(orderId: string, body: IDeliveredWork): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.put(`/deliver-order/${orderId}`, body);
    return response;
  }

  public async approveOrder(orderId: string, data: IOrderMessage): Promise<IOrderDocument> {
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          approved: true,
          status: 'Completed',
          approvedAt: new Date()
        }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    const messageDetails: IOrderMessage = {
      sellerId: data.sellerId,
      buyerId: data.buyerId,
      ongoingJobs: data.ongoingJobs,
      completedJobs: data.completedJobs,
      totalEarnings: data.totalEarnings, // this is the price the seller earned for lastest order delivered
      recentDelivery: `${new Date()}`,
      type: 'approve-order'
    };
    // update seller info
    await publishDirectMessage(
      channel,
      'jobber-seller-update',
      'user-seller',
      JSON.stringify(messageDetails),
      'Approved order details sent to users service.'
    );
    // update buyer info
    await publishDirectMessage(
      channel,
      'jobber-buyer-update',
      'user-buyer',
      JSON.stringify({ type: 'purchased-gigs', buyerId: data.buyerId, purchasedGigs: data.purchasedGigs }),
      'Approved order details sent to users service.'
    );
    sendNotification(order, order.sellerUsername, 'approved your order delivery.');
    return order;
  }

  async approveDeliveryDate(orderId: string, data: IExtendedDelivery): Promise<IOrderDocument> {
    const { newDate, days, reason, deliveryDateUpdate } = data;
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          ['offer.deliveryInDays']: days,
          ['offer.newDeliveryDate']: newDate,
          ['offer.reason']: reason,
          ['events.deliveryDateUpdate']: new Date(`${deliveryDateUpdate}`),
          requestExtension: {
            originalDate: '',
            newDate: '',
            days: 0,
            reason: ''
          }
        }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    if (order) {
      const messageDetails: IOrderMessage = {
        subject: 'Congratulations: Your extension request was approved',
        buyerUsername: lowerCase(order.buyerUsername),
        sellerUsername: lowerCase(order.sellerUsername),
        header: 'Request Accepted',
        type: 'accepted',
        message: 'You can continue working on the order.',
        orderUrl: `${config.CLIENT_URL}/orders/${orderId}/activities`,
        template: 'orderExtensionApproval'
      };
      // send email
      await publishDirectMessage(
        channel,
        'jobber-order-notification',
        'order-email',
        JSON.stringify(messageDetails),
        'Order request extension approval message sent to notification service.'
      );
      sendNotification(order, order.sellerUsername, 'approved your order delivery date extension request.');
    }
    return order;
  }

  async getNotifications(userTo: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosOrderInstance.get(`/notification/${userTo}`);
    return response;
  }

  async rejectDeliveryDate(orderId: string): Promise<IOrderDocument> {
    const order: IOrderDocument = (await OrderModel.findOneAndUpdate(
      { orderId },
      {
        $set: {
          requestExtension: {
            originalDate: '',
            newDate: '',
            days: 0,
            reason: ''
          }
        }
      },
      { new: true }
    ).exec()) as IOrderDocument;
    if (order) {
      const messageDetails: IOrderMessage = {
        subject: 'Sorry: Your extension request was rejected',
        buyerUsername: lowerCase(order.buyerUsername),
        sellerUsername: lowerCase(order.sellerUsername),
        header: 'Request Rejected',
        type: 'rejected',
        message: 'You can contact the buyer for more information.',
        orderUrl: `${config.CLIENT_URL}/orders/${orderId}/activities`,
        template: 'orderExtensionApproval'
      };
      // send email
      await publishDirectMessage(
        channel,
        'jobber-order-notification',
        'order-email',
        JSON.stringify(messageDetails),
        'Order request extension rejection message sent to notification service.'
      );
      sendNotification(order, order.sellerUsername, 'rejected your order delivery date extension request.');
    }
    return order;
  }
}

export const orderService: OrderService = new OrderService();
