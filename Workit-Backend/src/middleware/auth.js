const { clerkClient, verifyToken } = require('@clerk/express');
const User = require('../models/User');

const parseBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') return null;
  const trimmed = authorizationHeader.trim();
  const separatorIndex = trimmed.indexOf(' ');

  if (separatorIndex === -1) return null;

  const scheme = trimmed.slice(0, separatorIndex).toLowerCase();
  if (scheme !== 'bearer') return null;

  return trimmed.slice(separatorIndex + 1).trim() || null;
};

const verifyClerkToken = async (token, context) => {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error(`[auth:${context}] CLERK_SECRET_KEY is not configured`);
    return null;
  }

  try {
    return await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  } catch (error) {
    console.warn(`[auth:${context}] Token verification failed: ${error.message}`);
    return null;
  }
};

const fetchClerkUser = async (clerkUserId, context) => {
  if (!clerkClient?.users || typeof clerkClient.users.getUser !== 'function') {
    console.error(`[auth:${context}] Clerk client is unavailable (users.getUser missing)`);
    return null;
  }

  try {
    return await clerkClient.users.getUser(clerkUserId);
  } catch (error) {
    console.error(`[auth:${context}] Failed to fetch user from Clerk: ${error.message}`);
    return null;
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = parseBearerToken(authHeader);

    if (!token) {
      const scheme = typeof authHeader === 'string' ? authHeader.split(' ')[0] : 'none';
      console.warn(`[auth:required] Missing or malformed Authorization header (scheme: ${scheme})`);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }

    const verifiedToken = await verifyClerkToken(token, 'required');
    if (!verifiedToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }

    const clerkUserId = verifiedToken.sub;

    if (!clerkUserId) {
      console.warn('[auth:required] Token payload missing sub claim');
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }

    // Find user in MongoDB
    let user = await User.findOne({ clerkUserId });

    if (!user) {
      const clerkUser = await fetchClerkUser(clerkUserId, 'required');
      if (!clerkUser) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
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
        console.error(`[auth:required] Clerk user ${clerkUserId} has no email address`);
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
        });
      }

      // Create user in MongoDB
      try {
        user = await User.create({
          clerkUserId,
          email,
          name,
        });
        console.log(`[auth:required] User provisioned in MongoDB: ${user._id}`);
      } catch (createError) {
        console.error('[auth:required] User creation failed:', createError.message);
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
        });
      }
    }

    // Attach user document to request
    req.user = user;
    req.clerkUserId = clerkUserId;

    next();
  } catch (error) {
    console.error('[auth:required] Authentication error:', error.message);
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
    const token = parseBearerToken(authHeader);

    // If no valid auth header, continue without user
    if (!token) {
      return next();
    }

    const verifiedToken = await verifyClerkToken(token, 'optional');
    if (!verifiedToken) {
      // Invalid token, but optional auth should not fail the request
      return next();
    }

    const clerkUserId = verifiedToken.sub;

    if (!clerkUserId) {
      return next();
    }

    // Find user in MongoDB
    let user = await User.findOne({ clerkUserId });

    if (!user) {
      const clerkUser = await fetchClerkUser(clerkUserId, 'optional');
      if (!clerkUser) {
        return next();
      }

      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      const name = 
        clerkUser.fullName ||
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        clerkUser.username ||
        'User';

      if (email) {
        try {
          user = await User.create({
            clerkUserId,
            email,
            name,
          });
        } catch (createError) {
          console.error(`[auth:optional] User creation failed: ${createError.message}`);
          return next();
        }
      } else {
        console.warn(`[auth:optional] Clerk user ${clerkUserId} has no email address`);
      }
    }

    // Attach user document to request if found
    if (user) {
      req.user = user;
      req.clerkUserId = clerkUserId;
    }

    next();
  } catch (error) {
    console.error('[auth:optional] Optional authentication error:', error.message);
    // Don't fail the request, just continue without user
    next();
  }
};

module.exports = { authenticate, optionalAuthenticate };