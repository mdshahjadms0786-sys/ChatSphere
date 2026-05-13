const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'system'],
      default: 'text',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    imageUrl: {
      type: String,
      default: '',
    },
    audioUrl: {
      type: String,
      default: '',
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    // Advanced features
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    originalContent: {
      type: String,
      default: '',
    },
    linkPreview: {
      url: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' },
    },
    fileInfo: {
      name: { type: String, default: '' },
      size: { type: Number, default: 0 },
      type: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, isPinned: 1 });
messageSchema.index({ content: 'text' });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;