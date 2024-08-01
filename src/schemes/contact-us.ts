import Joi, { ObjectSchema } from 'joi';

const ContactUsSchema: ObjectSchema = Joi.object().keys({
  title: Joi.string().min(4).max(32).required().messages({
    'string.base': 'title must be of type string',
    'string.min': 'Invalid title',
    'string.max': 'Invalid title',
    'string.empty': 'title is a required field'
  }),
  description: Joi.string().min(4).max(255).required().messages({
    'string.base': 'description must be of type string',
    'string.min': 'Invalid description',
    'string.max': 'Invalid description',
    'string.empty': 'description is a required field'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email is a required field'
  }),
});

export { ContactUsSchema };
