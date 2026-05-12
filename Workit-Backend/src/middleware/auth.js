const { clerkClient } = require('@clerk/express');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing or malformed',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token not provided',
      });
    }

    // Verify the Clerk JWT using the token
    const { verifyToken } = require('@clerk/express');
    let verifiedToken;
    try {
      verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const clerkUserId = verifiedToken.sub;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload',
      });
    }

    // Find user in MongoDB
    let user = await User.findOne({ clerkUserId });

    if (!user) {
      let clerkUser;
      try {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
      } catch (clerkError) {
        console.error('Failed to fetch user from Clerk:', clerkError.message);
        return res.status(401).json({
          success: false,
          error: 'Failed to fetch user data',
        });
      }

      // Extract email and name from Clerk user object
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      const name = 
        clerkUser.fullName ||
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        clerkUser.username ||
        'User';

      if (!email) {
        return res.status(401).json({
          success: false,
          error: 'Email not found in Clerk user data',
        });
      }

      // Create user in MongoDB
      try {
        user = await User.create({
          clerkUserId,
          email,
          name,
        });
        console.log('User created successfully:', user._id);
      } catch (createError) {
        console.error('User creation failed:', createError);
        return res.status(401).json({
          success: false,
          error: 'Failed to create user',
        });
      }
    }

    // Attach user document to request
    req.user = user;
    req.clerkUserId = clerkUserId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * - If Authorization header exists, verifies and attaches user
 * - If no Authorization header, continues without user
 * - Does NOT return 401 errors for missing auth
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, just continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔓 [optionalAuth] NO AUTH HEADER - Continuing without user');
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('🔓 [optionalAuth] NO TOKEN - Continuing without user');
      return next();
    }

    console.log('🔐 [optionalAuth] TOKEN FOUND - Verifying...');

    // Verify the Clerk JWT using the token
    const { verifyToken } = require('@clerk/express');
    let verifiedToken;
    try {
      verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      console.log('✅ [optionalAuth] TOKEN VERIFIED - clerkUserId:', verifiedToken.sub);
    } catch (err) {
      // Invalid token, but we don't fail the request
      console.log('⚠️ [optionalAuth] Token verification failed:', err.message);
      return next();
    }

    const clerkUserId = verifiedToken.sub;

    if (!clerkUserId) {
      console.log('⚠️ [optionalAuth] NO clerkUserId in token');
      return next();
    }

    // Find user in MongoDB
    console.log('🔍 [optionalAuth] Looking for user in MongoDB with clerkUserId:', clerkUserId);
    let user = await User.findOne({ clerkUserId });

    if (!user) {
      console.log('👤 [optionalAuth] User not found in MongoDB, fetching from Clerk...');
      // Fetch user data from Clerk API
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        const email = clerkUser.emailAddresses?.[0]?.emailAddress;
        const name = 
          clerkUser.fullName ||
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          clerkUser.username ||
          'User';

        if (email) {
          user = await User.create({
            clerkUserId,
            email,
            name,
          });
          console.log('✅ [optionalAuth] User created successfully, MongoDB ID:', user._id);
        }
      } catch (createError) {
        console.error('❌ [optionalAuth] User creation failed:', createError);
        return next();
      }
    } else {
      console.log('✅ [optionalAuth] User found in MongoDB, ID:', user._id);
    }

    // Attach user document to request if found
    if (user) {
      req.user = user;
      req.clerkUserId = clerkUserId;
      console.log('🔐 [optionalAuth] USER ATTACHED TO REQUEST - MongoDB ID:', user._id);
    } else {
      console.log('⚠️ [optionalAuth] User could not be created/found');
    }

    next();
  } catch (error) {
    console.error('❌ [optionalAuth] Optional authentication error:', error);
    // Don't fail the request, just continue without user
    next();
  }
};

module.exports = { authenticate, optionalAuthenticate };