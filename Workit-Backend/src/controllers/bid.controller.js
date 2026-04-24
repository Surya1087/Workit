const { Bid, Gig, BID_STATUS, GIG_STATUS } = require('../models');
const { emitToUser } = require('../utils');

const createBid = async (req, res) => {
  try {
    const { gigId, message, price, contactName, contactEmail, contactPhone } = req.body;
    const freelancerId = req.user._id;

    const errors = [];

    if (!gigId || typeof gigId !== 'string' || !gigId.trim()) {
      errors.push('Gig ID is required');
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      errors.push('Message is required');
    }

    if (price === undefined || price === null) {
      errors.push('Price is required');
    } else if (typeof price !== 'number' || price < 1) {
      errors.push('Price must be a positive number');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    const gig = await Gig.findById(gigId);

    if (!gig) {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    if (gig.status !== GIG_STATUS.OPEN) {
      return res.status(400).json({
        success: false,
        error: 'Gig is no longer accepting bids',
      });
    }

    if (gig.ownerId.toString() === freelancerId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You cannot bid on your own gig',
      });
    }

    // Use freelancerId from authenticated session, not client input
    const bid = await Bid.create({
      gigId,
      freelancerId,
      message: message.trim(),
      price,
      contactName: contactName?.trim() || '',
      contactEmail: contactEmail?.trim() || '',
      contactPhone: contactPhone?.trim() || '',
      status: BID_STATUS.PENDING,
    });

    await bid.populate('freelancerId', 'name email');

    // Emit socket event to gig owner
    const gigOwnerId = gig.ownerId.toString();
    emitToUser(gigOwnerId, 'bid:received', {
      bidId: bid._id,
      gigId: gig._id,
      gigTitle: gig.title,
      freelancerName: bid.freelancerId.name,
      bidPrice: bid.price,
      message: bid.message,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: bid._id,
        gigId: bid.gigId,
        freelancer: {
          id: bid.freelancerId._id,
          name: bid.freelancerId.name,
          email: bid.freelancerId.email,
        },
        message: bid.message,
        price: bid.price,
        contactName: bid.contactName,
        contactEmail: bid.contactEmail,
        contactPhone: bid.contactPhone,
        status: bid.status,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating bid:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'You have already submitted a bid for this gig',
      });
    }

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
      error: 'Failed to create bid',
    });
  }
};

const getBidsForGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const userId = req.user._id;

    const gig = await Gig.findById(gigId);

    if (!gig) {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    if (gig.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the gig owner can view bids',
      });
    }

    const bids = await Bid.find({ gigId })
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const transformedBids = bids.map((bid) => ({
      id: bid._id,
      gigId: bid.gigId,
      freelancer: {
        id: bid.freelancerId._id,
        name: bid.freelancerId.name,
        email: bid.freelancerId.email,
      },
      message: bid.message,
      price: bid.price,
      contactName: bid.contactName,
      contactEmail: bid.contactEmail,
      contactPhone: bid.contactPhone,
      status: bid.status,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedBids,
      count: transformedBids.length,
    });
  } catch (error) {
    console.error('Error fetching bids for gig:', error);

    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid gig ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bids',
    });
  }
};

const getMyBid = async (req, res) => {
  try {
    const { gigId } = req.params;
    const freelancerId = req.user._id;

    const bid = await Bid.findOne({ gigId, freelancerId })
      .populate('freelancerId', 'name email')
      .lean();

    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: bid._id,
        gigId: bid.gigId,
        freelancer: {
          id: bid.freelancerId._id,
          name: bid.freelancerId.name,
          email: bid.freelancerId.email,
        },
        message: bid.message,
        price: bid.price,
        contactName: bid.contactName,
        contactEmail: bid.contactEmail,
        contactPhone: bid.contactPhone,
        status: bid.status,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user bid for gig:', error);

    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid gig ID format',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bid',
    });
  }
};

const updateBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { message, price } = req.body;
    const freelancerId = req.user._id;

    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found',
      });
    }

    if (bid.freelancerId.toString() !== freelancerId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the bid owner can update this bid',
      });
    }

    if (bid.status !== BID_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a bid that is not pending',
      });
    }

    if (message !== undefined) {
      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message must be a non-empty string',
        });
      }
      bid.message = message.trim();
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price < 1) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a positive number',
        });
      }
      bid.price = price;
    }

    await bid.save();
    await bid.populate('freelancerId', 'name email');

    return res.status(200).json({
      success: true,
      data: {
        id: bid._id,
        gigId: bid.gigId,
        freelancer: {
          id: bid.freelancerId._id,
          name: bid.freelancerId.name,
          email: bid.freelancerId.email,
        },
        message: bid.message,
        price: bid.price,
        contactName: bid.contactName,
        contactEmail: bid.contactEmail,
        contactPhone: bid.contactPhone,
        status: bid.status,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating bid:', error);

    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid bid ID format',
      });
    }

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
      error: 'Failed to update bid',
    });
  }
};

const getMyBids = async (req, res) => {
  try {
    const freelancerId = req.user._id;

    const bids = await Bid.find({ freelancerId })
      .populate('gigId', 'title budget')
      .sort({ createdAt: -1 })
      .lean();

    const transformedBids = bids.map((bid) => ({
      id: bid._id,
      gigId: bid.gigId._id,
      gig: {
        id: bid.gigId._id,
        title: bid.gigId.title,
        budget: bid.gigId.budget,
      },
      message: bid.message,
      price: bid.price,
      contactName: bid.contactName,
      contactEmail: bid.contactEmail,
      contactPhone: bid.contactPhone,
      status: bid.status,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: transformedBids,
      count: transformedBids.length,
    });
  } catch (error) {
    console.error('Error fetching user bids:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bids',
    });
  }
};

module.exports = {
  createBid,
  getBidsForGig,
  getMyBid,
  updateBid,
  getMyBids,
};
