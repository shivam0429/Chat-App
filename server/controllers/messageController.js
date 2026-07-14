import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as messageService from '../services/messageService.js';

// ---- Public room ----

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getPublicMessages();
  res.status(200).json({
    success: true,
    message: 'Messages fetched successfully',
    data: messages,
  });
});

export const clearMessages = asyncHandler(async (req, res) => {
  await messageService.clearPublicMessages();

  const io = req.app.get('io');
  if (io) {
    io.emit('chat_cleared');
  }

  res.status(200).json({
    success: true,
    message: 'Chat history cleared',
    data: null,
  });
});

// ---- Private conversations ----

export const getDirectMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const messages = await messageService.getConversation(req.user._id, userId);

  res.status(200).json({
    success: true,
    message: 'Conversation fetched successfully',
    data: messages,
  });
});

export const clearDirectMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  await messageService.clearConversation(req.user._id, userId);

  const io = req.app.get('io');
  if (io) {
    io.to(String(req.user._id))
      .to(String(userId))
      .emit('dm_cleared', { participants: [String(req.user._id), String(userId)] });
  }

  res.status(200).json({
    success: true,
    message: 'Conversation cleared',
    data: null,
  });
});

// ---- Shared send (public or private, used by the REST fallback) ----

export const postMessage = asyncHandler(async (req, res) => {
  const { message, recipientId } = req.body;
  const sender = req.user._id;
  const username = req.user.username;

  if (recipientId && !mongoose.Types.ObjectId.isValid(recipientId)) {
    throw new ApiError(400, 'Invalid recipient id');
  }

  const newMessage = await messageService.createMessage({
    sender,
    username,
    recipient: recipientId || null,
    message,
  });

  const io = req.app.get('io');
  if (io) {
    if (newMessage.recipient) {
      io.to(String(newMessage.recipient)).to(String(sender)).emit('receive_message', newMessage);
    } else {
      io.emit('receive_message', newMessage);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Message created successfully',
    data: newMessage,
  });
});
