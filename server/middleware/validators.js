import { body, validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export const validateMessage = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),
  body('recipientId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid recipient id'),
];

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError(
        400,
        'Validation failed',
        errors.array().map((e) => e.msg)
      )
    );
  }
  next();
};
