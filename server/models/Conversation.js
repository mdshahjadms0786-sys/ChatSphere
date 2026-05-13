const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Participants are required'],
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: '',
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Advanced features
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: [],
    }],
    description: {
      type: String,
      default: '',
      maxlength: 256,
    },
    isMuted: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for faster queries
conversationSchema.index({ participants: 1, lastMessageTime: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;