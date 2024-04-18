import { Application } from 'express';
import { healthRoutes } from '@jobber/routes/health';
import { authRoutes } from '@jobber/routes/auth';
import { currentUserRoutes } from '@jobber/routes/current-user';
import { authMiddleware } from '@jobber/services/auth-middleware';
import { searchRoutes } from '@jobber/routes/search';
import { buyerRoutes } from '@jobber/routes/buyer';
import { sellerRoutes } from '@jobber/routes/seller';
import { gigRoutes } from '@jobber/routes/gig';
import { messageRoutes } from '@jobber/routes/message';
import { orderRoutes } from '@jobber/routes/order';
import { reviewRoutes } from '@jobber/routes/review';

const BASE_PATH = '/api/v1';

export const appRoutes = (app: Application) => {
  app.use('', healthRoutes.routes());
  app.use(BASE_PATH, authRoutes.routes());
  app.use(BASE_PATH, searchRoutes.routes());

  app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, buyerRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, sellerRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, gigRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, messageRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, orderRoutes.routes());
  app.use(BASE_PATH, authMiddleware.verifyUser, reviewRoutes.routes());
};
