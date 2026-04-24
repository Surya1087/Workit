const express = require('express');
const gigRoutes = require('./gig.routes');
const bidRoutes = require('./bid.routes');
const authRoutes = require('./auth.routes');
const messageRoutes = require('./message.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/gigs', gigRoutes);
router.use('/bids', bidRoutes);
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);

module.exports = router;
