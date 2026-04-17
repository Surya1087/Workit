const express = require('express');
const bidController = require('../controllers/bid.controller');
const hireController = require('../controllers/hire.controller');
const { authenticate } = require('../middleware');

const router = express.Router();

// POST /api/bids - Create bid (auth required)
router.post('/', authenticate, bidController.createBid);

// GET /api/bids/my - Get all user's bids (auth required)
router.get('/my', authenticate, bidController.getMyBids);

// GET /api/bids/my/:gigId - Get user's own bid for a gig (auth required)
// MUST come after GET /my
router.get('/my/:gigId', authenticate, bidController.getMyBid);

// PUT /api/bids/:bidId - Update user's own bid (auth required)
router.put('/:bidId', authenticate, bidController.updateBid);

// PATCH /api/bids/:bidId/hire - Hire freelancer (auth required, gig owner only)
router.patch('/:bidId/hire', authenticate, hireController.hireBid);

// GET /api/bids/:gigId - Get bids for gig (auth required, owner only)
// MUST come LAST so it doesn't match /my/:gigId
router.get('/:gigId', authenticate, bidController.getBidsForGig);

module.exports = router;
