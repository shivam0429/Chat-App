import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/sendEmail.js';

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
});

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { token, user: sanitizeUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { token, user: sanitizeUser(user) },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Current user fetched',
    data: { user: sanitizeUser(req.user) },
  });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const token = generateToken(req.user._id);
  const redirectUrl = `${process.env.CLIENT_URL}/auth/google/callback?token=${token}`;
  res.redirect(redirectUrl);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always respond with success, even if no account exists — avoids leaking
  // which emails are registered.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a reset link has been sent',
      data: null,
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
  await sendPasswordResetEmail({ to: user.email, resetUrl });
} catch (err) {
  console.error('EMAIL SEND ERROR:', err.message); 
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save({ validateBeforeSave: false });
  throw new ApiError(500, 'Failed to send reset email. Please try again later.');
}

  res.status(200).json({
    success: true,
    message: 'If an account exists for this email, a reset link has been sent',
    data: null,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new ApiError(400, 'Reset link is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const authToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
    data: { token: authToken, user: sanitizeUser(user) },
  });
});
