import { verifyToken } from '../utils/generateToken.js';
import User from '../models/User.js';
import * as messageService from '../services/messageService.js';

// username -> Set of socket ids (supports multiple tabs per user)
const onlineUsers = new Map();

// userId -> userId currently in a call/ringing with, so a mid-call
// disconnect can still notify the other party.
const activeCalls = new Map();

const addOnlineUser = (username, socketId) => {
  if (!onlineUsers.has(username)) onlineUsers.set(username, new Set());
  onlineUsers.get(username).add(socketId);
};

const removeOnlineUser = (username, socketId) => {
  if (!onlineUsers.has(username)) return;
  onlineUsers.get(username).delete(socketId);
  if (onlineUsers.get(username).size === 0) onlineUsers.delete(username);
};

const getOnlineUsernames = () => Array.from(onlineUsers.keys());

const linkCall = (userA, userB) => {
  activeCalls.set(userA, userB);
  activeCalls.set(userB, userA);
};

const unlinkCall = (userId) => {
  const other = activeCalls.get(userId);
  activeCalls.delete(userId);
  if (other) activeCalls.delete(other);
  return other;
};

// Verifies the JWT sent during the socket handshake before allowing a connection.
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('User no longer exists'));

    socket.data.username = user.username;
    socket.data.userId = user._id.toString();
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
};

const registerSocketHandlers = (io) => {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const username = socket.data.username;
    const userId = socket.data.userId;
    console.log(`Socket connected: ${socket.id} (${username})`);

    // Every socket for this user joins a personal room keyed by their user id.
    // Private messages/typing events and call signaling are routed to this
    // room instead of a global broadcast, so they stay private between the
    // two participants while still reaching all of a user's open tabs/devices.
    socket.join(userId);

    addOnlineUser(username, socket.id);
    socket.broadcast.emit('user_joined', { username });
    io.emit('online_users', getOnlineUsernames());

    socket.on('send_message', async (payload, callback) => {
      try {
        const message = (payload?.message || '').trim();
        const recipientId = payload?.recipientId || null;

        if (!message) {
          if (typeof callback === 'function') {
            callback({ success: false, message: 'Message cannot be empty' });
          }
          return;
        }

        const savedMessage = await messageService.createMessage({
          sender: userId,
          username,
          recipient: recipientId,
          message,
        });

        if (recipientId) {
          // Private message: only the sender's own room and the recipient's
          // room receive it, not a global broadcast.
          io.to(recipientId).to(userId).emit('receive_message', savedMessage);
        } else {
          io.emit('receive_message', savedMessage);
        }

        if (typeof callback === 'function') {
          callback({ success: true, data: savedMessage });
        }
      } catch (error) {
        console.error('send_message error:', error.message);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Failed to send message' });
        }
        socket.emit('socket_error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (payload) => {
      const recipientId = payload?.recipientId;
      if (recipientId) {
        socket.to(recipientId).emit('typing', { username, userId, scope: 'dm' });
      } else {
        socket.broadcast.emit('typing', { username, scope: 'public' });
      }
    });

    socket.on('stop_typing', (payload) => {
      const recipientId = payload?.recipientId;
      if (recipientId) {
        socket.to(recipientId).emit('stop_typing', { username, userId, scope: 'dm' });
      } else {
        socket.broadcast.emit('stop_typing', { username, scope: 'public' });
      }
    });

    // ---- WebRTC call signaling (audio/video) ----
    // The server never touches media itself — it only relays the offer/
    // answer/ICE candidates between the two peers so they can negotiate a
    // direct (or TURN-relayed) WebRTC connection.

    socket.on('call_user', (payload, callback) => {
      const { toUserId, offer, callType } = payload || {};

      if (!toUserId || !offer) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Invalid call request' });
        }
        return;
      }

      if (toUserId === userId) {
        if (typeof callback === 'function') {
          callback({ success: false, message: "You can't call yourself" });
        }
        return;
      }

      if (activeCalls.has(userId) || activeCalls.has(toUserId)) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Already on a call' });
        }
        return;
      }

      const targetRoom = io.sockets.adapter.rooms.get(toUserId);
      if (!targetRoom || targetRoom.size === 0) {
        if (typeof callback === 'function') {
          callback({ success: false, message: 'User is offline' });
        }
        return;
      }

      linkCall(userId, toUserId);

      io.to(toUserId).emit('call_made', {
        fromUserId: userId,
        fromUsername: username,
        offer,
        callType: callType === 'video' ? 'video' : 'audio',
      });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    socket.on('answer_call', (payload) => {
      const { toUserId, answer } = payload || {};
      if (!toUserId || !answer) return;
      io.to(toUserId).emit('call_answered', { fromUserId: userId, answer });
    });

    socket.on('ice_candidate', (payload) => {
      const { toUserId, candidate } = payload || {};
      if (!toUserId || !candidate) return;
      io.to(toUserId).emit('ice_candidate', { fromUserId: userId, candidate });
    });

    socket.on('call_declined', (payload) => {
      const { toUserId } = payload || {};
      unlinkCall(userId);
      if (!toUserId) return;
      io.to(toUserId).emit('call_declined', { fromUserId: userId });
    });

    socket.on('end_call', (payload) => {
      const { toUserId } = payload || {};
      unlinkCall(userId);
      if (!toUserId) return;
      io.to(toUserId).emit('call_ended', { fromUserId: userId });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (${username})`);
      removeOnlineUser(username, socket.id);

      // If this user was mid-call/ringing, let the other party know so
      // their UI doesn't hang waiting on a peer that's gone.
      const peerId = unlinkCall(userId);
      if (peerId) {
        io.to(peerId).emit('call_ended', { fromUserId: userId });
      }

      socket.broadcast.emit('user_left', { username });
      io.emit('online_users', getOnlineUsernames());
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });
  });
};

export default registerSocketHandlers;
