const express = require('express');
const { authenticate } = require('../middleware');
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  deleteConversation,
  deleteMessage,
} = require('../controllers/message.controller');

const router = express.Router();

// Protect all message routes
router.use(authenticate);

// Send a message
router.post('/', sendMessage);

// Get all conversations
router.get('/', getConversations);

// ✅ DELETE /api/messages/:userId - Delete entire conversation with user
router.delete('/:userId', deleteConversation);

// ✅ DELETE /api/messages/:userId/:messageId - Delete specific message
router.delete('/:userId/:messageId', deleteMessage);

// Get conversation with a specific user
router.get('/:userId', getConversation);

// Mark conversation as read
router.put('/:conversationUserId/read', markAsRead);

module.exports = router;