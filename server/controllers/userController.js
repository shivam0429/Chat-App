import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// Returns every other registered user, for populating the DM sidebar.
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select('username email avatar')
    .sort({ username: 1 })
    .lean();

  const sanitized = users.map((u) => ({
    id: u._id,
    username: u.username,
    email: u.email,
    avatar: u.avatar,
  }));

  res.status(200).json({
    success: true,
    message: 'Users fetched successfully',
    data: sanitized,
  });
});
