import Message from '../models/Message.js';

// ---- Public room ----

export const getPublicMessages = async () => {
  return Message.find({ recipient: null }).sort({ createdAt: 1 }).lean();
};

export const clearPublicMessages = async () => {
  return Message.deleteMany({ recipient: null });
};

// ---- Private conversations ----

export const getConversation = async (userA, userB) => {
  return Message.find({
    recipient: { $ne: null },
    $or: [
      { sender: userA, recipient: userB },
      { sender: userB, recipient: userA },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();
};

export const clearConversation = async (userA, userB) => {
  return Message.deleteMany({
    recipient: { $ne: null },
    $or: [
      { sender: userA, recipient: userB },
      { sender: userB, recipient: userA },
    ],
  });
};

// ---- Shared create (works for both public and private) ----

export const createMessage = async ({ sender, username, recipient = null, message }) => {
  const newMessage = await Message.create({ sender, username, recipient, message });
  return newMessage.toObject();
};
