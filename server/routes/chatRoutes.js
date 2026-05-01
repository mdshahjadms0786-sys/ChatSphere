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
} = require('../controllers/chatController');

router.get('/conversations', protect, getConversations);
router.get('/conversations/:userId', protect, getOrCreateConversation);
router.get('/messages/:conversationId', protect, getMessages);
router.get('/users/search', protect, searchUsers);
router.delete('/message/:messageId', protect, deleteMessage);
router.post('/message/:messageId/reaction', protect, addReaction);
router.put('/conversation/:conversationId/read', protect, markAsRead);
router.get('/messages/search', protect, searchMessages);

router.post('/group/create', protect, createGroup);
router.get('/group/:conversationId', protect, getGroupInfo);
router.post('/group/add-member', protect, addGroupMember);
router.post('/group/remove-member', protect, removeGroupMember);
router.delete('/group/:conversationId/leave', protect, leaveGroup);

router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);
router.get('/check-blocked/:userId', protect, checkIfBlocked);

module.exports = router;