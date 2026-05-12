const { Gig, GIG_STATUS, Bid } = require('../models');

const listGigs = async (req, res) => {
  try {
    const { status = 'open', limit = 20, skip = 0 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // ✅ EXCLUDE CURRENT USER'S GIGS IF AUTHENTICATED
    if (req.user && req.user._id) {
      console.log('✅ [listGigs] User authenticated, excluding gigs for user:', req.user._id);
      query.ownerId = { $ne: req.user._id };
    } else {
      console.log('🔓 [listGigs] No user authenticated, returning all gigs');
    }

    const gigs = await Gig.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await Gig.countDocuments(query);

    const formattedGigs = gigs.map((gig) => ({
      id: gig._id,
      title: gig.title,
      description: gig.description,
      budget: gig.budget,
      status: gig.status,
      ownerId: gig.ownerId._id,
      owner: {
        id: gig.ownerId._id,
        name: gig.ownerId.name,
        email: gig.ownerId.email,
      },
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
    }));

    console.log('✅ [listGigs] Returning', formattedGigs.length, 'gigs');

    return res.status(200).json({
      success: true,
      data: formattedGigs,
      total,
      count: formattedGigs.length,
    });
  } catch (error) {
    console.error('❌ [listGigs] Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch gigs',
    });
  }
};

const getGigById = async (req, res) => {
  try {
    const { id } = req.params;

    const gig = await Gig.findById(id)
      .populate('ownerId', 'name email')
      .lean();

    if (!gig) {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    let highestBidder = null;
    if (gig.status === GIG_STATUS.OPEN) {
      const lowestBid = await Bid.findOne({ gigId: id, status: 'pending' })
        .sort({ price: 1 })
        .populate('freelancerId', 'name')
        .lean();
      
      if (lowestBid && lowestBid.freelancerId) {
        highestBidder = {
          name: lowestBid.freelancerId.name,
          price: lowestBid.price,
        };
      }
    }

    // Check if the requesting user is the owner
    const isOwner = req.user && gig.ownerId._id.toString() === req.user._id.toString();

    const data = {
      id: gig._id,
      title: gig.title,
      description: gig.description,
      budget: gig.budget,
      status: gig.status,
      ownerId: gig.ownerId._id,
      owner: {
        id: gig.ownerId._id,
        name: gig.ownerId.name,
        email: gig.ownerId.email,
      },
      isOwner,
      highestBidder,
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching gig:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch gig',
    });
  }
};

const getMyGigs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit = 20, skip = 0 } = req.query;

    const query = { ownerId: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const gigs = await Gig.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    const total = await Gig.countDocuments(query);

    const formattedGigs = gigs.map((gig) => ({
      id: gig._id,
      title: gig.title,
      description: gig.description,
      budget: gig.budget,
      status: gig.status,
      ownerId: gig.ownerId._id,
      owner: {
        id: gig.ownerId._id,
        name: gig.ownerId.name,
        email: gig.ownerId.email,
      },
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: formattedGigs,
      total,
      count: formattedGigs.length,
    });
  } catch (error) {
    console.error('Error fetching user gigs:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch your gigs',
    });
  }
};

const createGig = async (req, res) => {
  try {
    const { title, description, budget } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. User not found in request.',
      });
    }

    const ownerId = req.user._id;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Description is required',
      });
    }

    if (!budget || budget < 1) {
      return res.status(400).json({
        success: false,
        error: 'Budget must be at least 1',
      });
    }

    // Create gig
    const gig = await Gig.create({
      title: title.trim(),
      description: description.trim(),
      budget: Number(budget),
      ownerId,
    });

    await gig.populate('ownerId', 'name email');

    const data = {
      id: gig._id,
      title: gig.title,
      description: gig.description,
      budget: gig.budget,
      status: gig.status,
      ownerId: gig.ownerId._id,
      owner: {
        id: gig.ownerId._id,
        name: gig.ownerId.name,
        email: gig.ownerId.email,
      },
      isOwner: true,
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
    };

    console.log('✅ Gig created successfully');
    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Error creating gig:', error);

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
      error: 'Failed to create gig',
    });
  }
};

// ✅ NEW: Delete gig function
const deleteGig = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    // Check if user is the owner
    if (gig.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this gig',
      });
    }

    // Delete the gig
    await Gig.findByIdAndDelete(id);

    console.log('✅ Gig deleted successfully:', id);

    return res.status(200).json({
      success: true,
      message: 'Gig deleted successfully',
      data: { id },
    });
  } catch (error) {
    console.error('❌ Error deleting gig:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to delete gig',
    });
  }
};

const closeGig = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const gig = await Gig.findById(id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    // Check if user is the owner
    if (gig.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to close this gig',
      });
    }

    gig.status = GIG_STATUS.CLOSED;
    await gig.save();
    await gig.populate('ownerId', 'name email');

    const data = {
      id: gig._id,
      title: gig.title,
      description: gig.description,
      budget: gig.budget,
      status: gig.status,
      ownerId: gig.ownerId._id,
      owner: {
        id: gig.ownerId._id,
        name: gig.ownerId.name,
        email: gig.ownerId.email,
      },
      isOwner: true,
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error closing gig:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Gig not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to close gig',
    });
  }
};

module.exports = {
  listGigs,
  getGigById,
  getMyGigs,
  createGig,
  deleteGig,
  closeGig,
};