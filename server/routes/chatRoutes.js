const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/chatController');

// Core chat routes
router.get('/conversations', protect, getConversations);
router.get('/conversations/:userId', protect, getOrCreateConversation);
router.get('/messages/:conversationId', protect, getMessages);
router.get('/users/search', protect, searchUsers);
router.get('/messages/search', protect, searchMessages);
router.delete('/message/:messageId', protect, deleteMessage);
router.post('/message/:messageId/reaction', protect, addReaction);
router.put('/conversation/:conversationId/read', protect, markAsRead);

// Group routes
router.post('/group/create', protect, createGroup);
router.get('/group/:conversationId', protect, getGroupInfo);
router.post('/group/add-member', protect, addGroupMember);
router.post('/group/remove-member', protect, removeGroupMember);
router.delete('/group/:conversationId/leave', protect, leaveGroup);

// Block routes
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);
router.get('/check-blocked/:userId', protect, checkIfBlocked);

// Advanced: Pin messages
router.post('/message/:messageId/pin', protect, pinMessage);
router.get('/pinned/:conversationId', protect, getPinnedMessages);

// Advanced: Star messages
router.post('/message/:messageId/star', protect, starMessage);
router.get('/starred', protect, getStarredMessages);

// Advanced: Edit message
router.put('/message/:messageId/edit', protect, editMessage);

// Advanced: Shared media
router.get('/media/:conversationId', protect, getSharedMedia);

// Advanced: Export chat
router.get('/export/:conversationId', protect, exportChat);

// Advanced: Settings
router.put('/settings', protect, updateSettings);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

// Advanced: Online users
router.get('/online-users', protect, getOnlineUsers);

// Advanced: Mute conversation
router.post('/conversation/:conversationId/mute', protect, toggleMuteConversation);

module.exports = router;