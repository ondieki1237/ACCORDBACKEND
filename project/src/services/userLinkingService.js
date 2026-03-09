/**
 * User Linking Service
 * Provides utilities for working with linked user accounts
 * Allows users to access data from their old/linked accounts
 */

import UserLink from '../models/UserLink.js';

/**
 * Get all user IDs that are linked to a given user
 * Includes the user's own ID plus any linked old user IDs
 * 
 * @param {ObjectId|string} userId - The current/new user ID
 * @returns {Promise<Array>} Array of user IDs (current + linked old accounts)
 */
export const getLinkedUserIds = async (userId) => {
  try {
    const userIds = [userId];

    // Find active links where this user is the new user
    const links = await UserLink.find({
      newUserId: userId,
      isActive: true
    }).select('oldUserId');

    // Add old user IDs to the array
    links.forEach(link => {
      if (link.oldUserId && !userIds.includes(link.oldUserId.toString())) {
        userIds.push(link.oldUserId);
      }
    });

    return userIds;
  } catch (error) {
    console.error('Error fetching linked user IDs:', error);
    return [userId];
  }
};

/**
 * Get the link info between a new and old user
 * 
 * @param {ObjectId|string} newUserId - The current/new user ID
 * @param {ObjectId|string} oldUserId - The old user ID
 * @returns {Promise<Object|null>} Link document or null
 */
export const getUserLink = async (newUserId, oldUserId) => {
  try {
    return await UserLink.findOne({
      newUserId,
      oldUserId,
      isActive: true
    }).populate(['newUserId', 'oldUserId', 'linkedBy']);
  } catch (error) {
    console.error('Error fetching user link:', error);
    return null;
  }
};

/**
 * Get all linked old accounts for a user
 * 
 * @param {ObjectId|string} newUserId - The current user ID
 * @returns {Promise<Array>} Array of linked old user documents
 */
export const getLinkedOldUsers = async (newUserId) => {
  try {
    const links = await UserLink.find({
      newUserId,
      isActive: true
    }).populate('oldUserId');

    return links.map(link => ({
      _id: link._id,
      user: link.oldUserId,
      reason: link.reason,
      linkedAt: link.createdAt,
      notes: link.notes
    }));
  } catch (error) {
    console.error('Error fetching linked old users:', error);
    return [];
  }
};

/**
 * Deactivate a user link
 * Useful when you want to stop sharing data from old account
 * 
 * @param {ObjectId|string} newUserId - The current user ID
 * @param {ObjectId|string} oldUserId - The old user ID
 * @returns {Promise<boolean>} Whether deactivation was successful
 */
export const deactivateUserLink = async (newUserId, oldUserId) => {
  try {
    const result = await UserLink.findOneAndUpdate(
      { newUserId, oldUserId },
      { isActive: false },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('Error deactivating user link:', error);
    return false;
  }
};

/**
 * Reactivate a user link
 * 
 * @param {ObjectId|string} newUserId - The current user ID
 * @param {ObjectId|string} oldUserId - The old user ID
 * @returns {Promise<boolean>} Whether reactivation was successful
 */
export const reactivateUserLink = async (newUserId, oldUserId) => {
  try {
    const result = await UserLink.findOneAndUpdate(
      { newUserId, oldUserId },
      { isActive: true },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('Error reactivating user link:', error);
    return false;
  }
};

/**
 * Check if a user has any linked old accounts
 * 
 * @param {ObjectId|string} userId - User ID to check
 * @returns {Promise<boolean>} Whether the user has linked accounts
 */
export const hasLinkedAccounts = async (userId) => {
  try {
    const count = await UserLink.countDocuments({
      newUserId: userId,
      isActive: true
    });
    return count > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Build MongoDB query filter for getting records from user and linked accounts
 * Useful for find() operations where you need to fetch data from multiple users
 * 
 * @param {ObjectId|string} userId - Current user ID
 * @param {string} userIdFieldName - Name of the userId field (default: 'userId')
 * @returns {Promise<Object>} MongoDB filter object for $in query
 */
export const buildUserIdFilter = async (userId, userIdFieldName = 'userId') => {
  try {
    const userIds = await getLinkedUserIds(userId);
    return {
      [userIdFieldName]: { $in: userIds }
    };
  } catch (error) {
    console.error('Error building filter:', error);
    return { [userIdFieldName]: userId };
  }
};

export default {
  getLinkedUserIds,
  getUserLink,
  getLinkedOldUsers,
  deactivateUserLink,
  reactivateUserLink,
  hasLinkedAccounts,
  buildUserIdFilter
};
