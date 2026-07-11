const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', 'name avatar status lastSeen about')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
      isGroup: false,
    }).populate('participants', 'name avatar status lastSeen about');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar status lastSeen about');
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { before, limit = 50 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const query = {
      conversation: conversationId,
      deletedFor: { $ne: req.user._id },
    };

    // Cursor-based pagination (using _id as tiebreaker for reliability)
    if (before) {
      const beforeDate = new Date(before);
      query.$or = [
        { createdAt: { $lt: beforeDate } },
        { createdAt: beforeDate, _id: { $lt: before } }
      ];
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('replyTo', 'content sender')
      .populate('pinnedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Reverse to get chronological order
    messages.reverse();

    const hasMore = messages.length === parseInt(limit);

    res.status(200).json({ success: true, messages, hasMore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(200).json({ success: true, users: [] });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .select('name email avatar status about')
      .limit(10);

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    if (deleteForEveryone) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000);
      if (message.createdAt < fiveMinAgo) {
        return res.status(400).json({ error: 'Cannot delete message older than 5 minutes' });
      }
      message.deletedForEveryone = true;
      message.content = 'This message was deleted';
    } else {
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(req.user._id);
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();
    await message.populate('sender', 'name avatar');
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $push: { readBy: req.user._id },
        $set: { status: 'read' },
      }
    );

    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;

    if (!q || !conversationId) {
      return res.status(400).json({ error: 'Query and conversationId required' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      content: { $regex: q, $options: 'i' },
      deletedForEveryone: false,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name required' });
    }

    if (!members || members.length < 2) {
      return res.status(400).json({ error: 'Add at least 2 members' });
    }

    const allMembers = [...members, req.user._id];

    const conversation = await Conversation.create({
      participants: allMembers,
      isGroup: true,
      groupName: name,
      groupAdmin: req.user._id,
    });

    await conversation.populate('participants', 'name avatar status lastSeen');

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGroupInfo = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name avatar status lastSeen about')
      .populate('groupAdmin', 'name')
      .populate({
        path: 'pinnedMessages',
        populate: { path: 'sender', select: 'name avatar' },
      });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addGroupMember = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only admin can add members' });
    }

    if (!conversation.participants.includes(userId)) {
      conversation.participants.push(userId);
      await conversation.save();
    }

    await conversation.populate('participants', 'name avatar status lastSeen');

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeGroupMember = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only admin can remove members' });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== userId
    );
    await conversation.save();

    await conversation.populate('participants', 'name avatar status lastSeen');

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );

    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      return res.status(200).json({ success: true, message: 'Left group successfully' });
    }

    await conversation.save();

    res.status(200).json({ success: true, message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const user = await User.findById(req.user._id);

    if (user.blockedUsers.includes(userId)) {
      return res.status(200).json({
        success: true,
        message: 'User already blocked'
      });
    }

    user.blockedUsers.push(userId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: userId } }
    );

    return res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'name email avatar');

    return res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

const checkIfBlocked = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);

    const isBlocked = user.blockedUsers
      .map(id => id.toString())
      .includes(userId);

    return res.status(200).json({
      success: true,
      isBlocked
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

// ===== ADVANCED FEATURES =====

// Pin/Unpin message
const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const conversation = await Conversation.findById(message.conversation);
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? req.user._id : null;
    message.pinnedAt = message.isPinned ? new Date() : null;
    await message.save();

    if (message.isPinned) {
      if (!conversation.pinnedMessages.includes(messageId)) {
        conversation.pinnedMessages.push(messageId);
      }
    } else {
      conversation.pinnedMessages = conversation.pinnedMessages.filter(
        (id) => id.toString() !== messageId
      );
    }
    await conversation.save();

    await message.populate('sender', 'name avatar');
    await message.populate('pinnedBy', 'name');

    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pinned messages
const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversation: conversationId,
      isPinned: true,
      deletedForEveryone: false,
    })
      .populate('sender', 'name avatar')
      .populate('pinnedBy', 'name')
      .sort({ pinnedAt: -1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Star/Unstar message
const starMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const user = await User.findById(req.user._id);
    const isStarred = user.starredMessages.includes(messageId);

    if (isStarred) {
      user.starredMessages = user.starredMessages.filter(
        (id) => id.toString() !== messageId
      );
    } else {
      user.starredMessages.push(messageId);
    }
    await user.save();

    res.status(200).json({
      success: true,
      starred: !isStarred,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get starred messages
const getStarredMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const messages = await Message.find({
      _id: { $in: user.starredMessages },
      deletedForEveryone: false,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name avatar')
      .populate('conversation', 'groupName isGroup participants')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Can only edit within 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60000);
    if (message.createdAt < fifteenMinAgo) {
      return res.status(400).json({ error: 'Cannot edit message older than 15 minutes' });
    }

    if (message.type !== 'text') {
      return res.status(400).json({ error: 'Can only edit text messages' });
    }

    if (!message.isEdited) {
      message.originalContent = message.content;
    }
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate('sender', 'name avatar');

    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get shared media for a conversation
const getSharedMedia = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type = 'image' } = req.query;

    const messages = await Message.find({
      conversation: conversationId,
      type: type,
      deletedForEveryone: false,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export chat history
const exportChat = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedForEveryone: false,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    let chatName = conversation.isGroup
      ? conversation.groupName
      : conversation.participants.map((p) => p.name).join(' & ');

    let exportText = `ChatSphere - Chat Export\n`;
    exportText += `Chat: ${chatName}\n`;
    exportText += `Exported: ${new Date().toLocaleString()}\n`;
    exportText += `Total Messages: ${messages.length}\n`;
    exportText += `${'='.repeat(50)}\n\n`;

    messages.forEach((msg) => {
      const time = new Date(msg.createdAt).toLocaleString();
      const sender = msg.sender?.name || 'Unknown';
      let content = msg.content || '';

      if (msg.type === 'image') content = '📷 [Image]';
      if (msg.type === 'audio') content = '🎤 [Voice Message]';
      if (msg.type === 'file') content = `📎 [File: ${msg.fileInfo?.name || 'Unknown'}]`;

      exportText += `[${time}] ${sender}: ${content}\n`;
    });

    res.status(200).json({ success: true, exportText, chatName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user settings
const updateSettings = async (req, res) => {
  try {
    const { theme, chatWallpaper, notificationSettings, privacySettings } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (theme) user.theme = theme;
    if (chatWallpaper !== undefined) user.chatWallpaper = chatWallpaper;
    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings,
      };
    }
    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings,
      };
    }

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If not a Google-only user, require password
    if (!user.googleId && password) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Password is incorrect' });
      }
    }

    // Remove user from all conversations
    await Conversation.updateMany(
      { participants: req.user._id },
      { $pull: { participants: req.user._id } }
    );

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('chatsphere_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'Lax',
      path: '/',
      maxAge: 0,
    });

    res.status(200).json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get online users
const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({
      status: 'online',
      _id: { $ne: req.user._id },
    })
      .select('name avatar status lastSeen')
      .limit(50);

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mute/Unmute conversation
const toggleMuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const currentMuted = conversation.isMuted?.get(req.user._id.toString()) || false;
    conversation.isMuted.set(req.user._id.toString(), !currentMuted);
    await conversation.save();

    res.status(200).json({
      success: true,
      muted: !currentMuted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  searchUsers,
  deleteMessage,
  addReaction,
  markAsRead,
  searchMessages,
  createGroup,
  getGroupInfo,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkIfBlocked,
  // Advanced
  pinMessage,
  getPinnedMessages,
  starMessage,
  getStarredMessages,
  editMessage,
  getSharedMedia,
  exportChat,
  updateSettings,
  changePassword,
  deleteAccount,
  getOnlineUsers,
  toggleMuteConversation,
};