const express = require('express');
const { authenticate } = require('../middleware');
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
} = require('../controllers/message.controller');

const router = express.Router();

// Protect all message routes
router.use(authenticate);

// Send a message
router.post('/', sendMessage);

// Get all conversations
router.get('/', getConversations);

// Get conversation with a specific user
router.get('/:userId', getConversation);

// Mark conversation as read
router.put('/:conversationUserId/read', markAsRead);

module.exports = router;
