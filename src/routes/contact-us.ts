import { Contact } from '@jobber/controllers/contact/contact-us';
import express, { Router } from 'express';

class ContactRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/contact', Contact.prototype.create);
    return this.router;
  }
}

export const contactRoutes: ContactRoutes = new ContactRoutes();
