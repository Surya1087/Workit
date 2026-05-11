const { clerkClient } = require('@clerk/express');
const User = require('../models/User');

const sendAuthError = (req, res, statusCode, error, details) => {
  console.warn('[auth] Authentication failed', {
    method: req.method,
    path: req.originalUrl,
    error,
    details,
  });

  return res.status(statusCode).json({
    success: false,
    error,
    message: error,
    ...(details ? { details } : {}),
  });
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendAuthError(req, res, 401, 'Authorization header missing or malformed', {
        authorizationHeaderPresent: Boolean(authHeader),
        expectedFormat: 'Authorization: Bearer <Clerk token>',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendAuthError(req, res, 401, 'Token not provided');
    }

    // Verify the Clerk JWT using the token
    const { verifyToken } = require('@clerk/express');
    let verifiedToken;
    try {
      verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch (err) {
      return sendAuthError(req, res, 401, 'Invalid or expired token', {
        reason: err.message,
      });
    }

    const clerkUserId = verifiedToken.sub;

    if (!clerkUserId) {
      return sendAuthError(req, res, 401, 'Invalid token payload');
    }

    // Find user in MongoDB
    let user = await User.findOne({ clerkUserId });

    if (!user) {
      let clerkUser;
      try {
        clerkUser = await clerkClient.users.getUser(clerkUserId);
      } catch (clerkError) {
        console.error('Failed to fetch user from Clerk:', clerkError.message);
        return sendAuthError(req, res, 401, 'Failed to fetch user data', {
          reason: clerkError.message,
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
        return sendAuthError(req, res, 401, 'Email not found in Clerk user data');
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
        return sendAuthError(req, res, 401, 'Failed to create user', {
          reason: createError.message,
        });
      }
    }

    // Attach user document to request
    req.user = user;
    req.clerkUserId = clerkUserId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return sendAuthError(req, res, 401, 'Authentication failed', {
      reason: error.message,
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
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Verify the Clerk JWT using the token
    const { verifyToken } = require('@clerk/express');
    let verifiedToken;
    try {
      verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch (err) {
      // Invalid token, but we don't fail the request
      console.log('Optional auth: Token verification failed:', err.message);
      return next();
    }

    const clerkUserId = verifiedToken.sub;

    if (!clerkUserId) {
      return next();
    }

    // Find user in MongoDB
    let user = await User.findOne({ clerkUserId });

    if (!user) {
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
          console.log('User created successfully:', user._id);
        }
      } catch (createError) {
        console.error('Optional auth: User creation failed:', createError);
        return next();
      }
    }

    // Attach user document to request if found
    if (user) {
      req.user = user;
      req.clerkUserId = clerkUserId;
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Don't fail the request, just continue without user
    next();
  }
};

module.exports = { authenticate, optionalAuthenticate };
