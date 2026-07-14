import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      // Denormalized sender display name at time of send, so history still
      // renders correctly even if the user later changes their name.
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    recipient: {
      // null/undefined = public room message. Set = private direct message.
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
