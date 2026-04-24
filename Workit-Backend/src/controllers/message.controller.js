const { Message } = require('../models');
const { emitToUser } = require('../utils');
const mongoose = require('mongoose');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, gigId, content } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID is required',
      });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long (max 5000 characters)',
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid receiver ID format',
      });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot send a message to yourself',
      });
    }

    // Create message
    const message = await Message.create({
      senderId,
      receiverId: new mongoose.Types.ObjectId(receiverId),
      gigId: gigId || null,
      content: content.trim(),
    });

    await message.populate('senderId', 'name email');

    // Emit real-time event to receiver
    emitToUser(receiverId, 'message:new', {
      id: message._id,
      senderId: message.senderId._id,
      senderName: message.senderId.name,
      content: message.content,
      gigId: message.gigId,
      createdAt: message.createdAt,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: message._id,
        senderId: message.senderId._id,
        senderName: message.senderId.name,
        receiverId: message.receiverId,
        gigId: message.gigId,
        content: message.content,
        read: message.read,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    // Fetch conversation
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Mark messages as read where current user is receiver
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: currentUserId,
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation',
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get list of unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$content' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationUserId } = req.params;
    const userId = req.user._id;

    if (!conversationUserId) {
      return res.status(400).json({
        success: false,
        error: 'Conversation user ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    const result = await Message.updateMany(
      {
        senderId: conversationUserId,
        receiverId: userId,
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
};
