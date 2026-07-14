import { Router } from 'express';
import passport from '../config/passport.js';
import {
  register,
  login,
  getMe,
  googleCallback,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/authValidators.js';
import { handleValidation } from '../middleware/validators.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', validateRegister, handleValidation, register);
router.post('/login', validateLogin, handleValidation, login);
router.get('/me', protect, getMe);

router.post('/forgot-password', validateForgotPassword, handleValidation, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, handleValidation, resetPassword);

// Google OAuth — stateless (no session), user identity carried via JWT after redirect
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

export default router;
