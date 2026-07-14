import { body } from 'express-validator';

export const validateRegister = [
  body('username').trim().notEmpty().withMessage('Username is required').isLength({ max: 30 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const validateLogin = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateForgotPassword = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
];

export const validateResetPassword = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
