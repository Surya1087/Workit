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

// ✅ POST /api/messages - Send a message
router.post('/', sendMessage);

// ✅ GET /api/messages - Get all conversations (BEFORE DELETE routes)
router.get('/', getConversations);

// ✅ DELETE /api/messages/:userId/:messageId - Delete specific message (BEFORE /:userId GET)
router.delete('/:userId/:messageId', deleteMessage);

// ✅ DELETE /api/messages/:userId - Delete entire conversation
router.delete('/:userId', deleteConversation);

// ✅ GET /api/messages/:userId - Get conversation with specific user (LAST!)
router.get('/:userId', getConversation);

// ✅ PUT /api/messages/:conversationUserId/read - Mark conversation as read
router.put('/:conversationUserId/read', markAsRead);

module.exports = router;