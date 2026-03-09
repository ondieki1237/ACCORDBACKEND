/**
 * Query Builder Middleware
 * Automatically includes linked account data in find queries
 * Makes existing APIs work with linked accounts without code changes
 */

import { getLinkedUserIds } from './userLinkingService.js';

/**
 * Wrap Mongoose find queries to automatically include linked account data
 * Usage: const query = await applyLinkedUserFilter(query, userId);
 * 
 * @param {Object} query - Mongoose query object
 * @param {ObjectId|string} userId - User making the request
 * @param {string} userFieldName - Name of the user ID field (default: 'userId')
 * @returns {Object} Updated query object
 */
export const applyLinkedUserFilter = async (query, userId, userFieldName = 'userId') => {
  try {
    const userIds = await getLinkedUserIds(userId);
    
    if (userIds.length > 1) {
      // User has linked accounts, include them
      query[userFieldName] = { $in: userIds };
    } else {
      // Only their own account
      query[userFieldName] = userId;
    }
    
    return query;
  } catch (error) {
    console.error('Error applying linked user filter:', error);
    // Fallback to single user if error
    return { [userFieldName]: userId };
  }
};

/**
 * Middleware for Express routes
 * Automatically adds user IDs (including linked) to request object
 * 
 * Usage in routes:
 * router.get('/', authenticate, linkedAccountMiddleware, async (req, res) => {
 *   const query = { userId: { $in: req.userIds } };
 *   ...
 * });
 */
export const linkedAccountMiddleware = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      req.userIds = await getLinkedUserIds(req.user._id);
    }
    next();
  } catch (error) {
    console.error('Error in linkedAccountMiddleware:', error);
    req.userIds = [req.user._id];
    next();
  }
};

/**
 * For paginate queries - applies to both find and countDocuments
 * Usage: const docs = await Model.paginate(await buildPaginateQuery(query, userId), options);
 */
export const buildPaginateQuery = async (query, userId, userFieldName = 'userId') => {
  return applyLinkedUserFilter(query, userId, userFieldName);
};

export default {
  applyLinkedUserFilter,
  linkedAccountMiddleware,
  buildPaginateQuery
};
