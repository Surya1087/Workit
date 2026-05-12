const express = require('express');
const gigController = require('../controllers/gig.controller');
const { authenticate, optionalAuthenticate } = require('../middleware');

const router = express.Router();

// ✅ IMPORTANT: Order matters! Specific routes BEFORE :id parameter routes

// GET /api/gigs/my - Get user's own gigs (auth required) - MUST be BEFORE /:id
router.get('/my', authenticate, gigController.getMyGigs);

// GET /api/gigs - List open gigs (public)
router.get('/', optionalAuthenticate, gigController.listGigs);

// POST /api/gigs - Create gig (auth required)
router.post('/', authenticate, gigController.createGig);

// DELETE /api/gigs/:id - Delete gig (auth required, owner only) - MUST be BEFORE /:id GET
router.delete('/:id', authenticate, gigController.deleteGig);

// PATCH /api/gigs/:id/close - Close gig (auth required, owner only)
router.patch('/:id/close', authenticate, gigController.closeGig);

// GET /api/gigs/:id - Get gig by id (public, but checks auth if present for ownership) - LAST!
router.get('/:id', optionalAuthenticate, gigController.getGigById);

module.exports = router;