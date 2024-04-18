import { Password } from '@jobber/controllers/auth/password';
import { AuthSeed } from '@jobber/controllers/auth/seed';
import { SignIn } from '@jobber/controllers/auth/signin';
import { Signout } from '@jobber/controllers/auth/signout';
import { SignUp } from '@jobber/controllers/auth/signup';
import { VerifyEmail } from '@jobber/controllers/auth/verify-email';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/auth/signup', SignUp.prototype.create);
    this.router.post('/auth/signin', SignIn.prototype.read);
    this.router.post('/auth/signout', Signout.prototype.update);
    this.router.put('/auth/verify-email', VerifyEmail.prototype.update);
    this.router.put('/auth/forgot-password', Password.prototype.forgotPassword);
    this.router.put('/auth/reset-password/:token', Password.prototype.resetPassword);
    this.router.put('/auth/change-password', Password.prototype.changePassword);
    this.router.put('/auth/seed/:count', AuthSeed.prototype.create);
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
