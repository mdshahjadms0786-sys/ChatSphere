const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: { $in: [req.user._id] },
    })
      .populate('participants', 'name avatar status lastSeen')
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
    }).populate('participants', 'name avatar status lastSeen');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar status lastSeen');
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
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

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: 1 })
      .limit(50);

    res.status(200).json({ success: true, messages });
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
      .select('name email avatar status')
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
      const oneMinuteAgo = new Date(Date.now() - 60000);
      if (message.createdAt < oneMinuteAgo) {
        return res.status(400).json({ error: 'Cannot delete message older than 1 minute' });
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

const updateProfile = async (req, res) => {
  try {
    const { name, about, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (about !== undefined) user.about = about;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.status(200).json({ success: true, user });
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
      .populate('participants', 'name avatar status lastSeen')
      .populate('groupAdmin', 'name');

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

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  searchUsers,
  deleteMessage,
  addReaction,
  markAsRead,
  searchMessages,
  updateProfile,
  createGroup,
  getGroupInfo,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkIfBlocked,
};