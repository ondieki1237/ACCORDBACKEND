/**
 * Example implementation of user account linking in API endpoints
 * This shows how to update routes to fetch data from both current and linked accounts
 */

import { buildUserIdFilter, getLinkedUserIds } from './userLinkingService.js';

/**
 * EXAMPLE 1: Get all visits for user + linked old accounts (visits.js)
 * 
 * Before:
 * if (req.user.role === 'sales') {
 *   query.userId = req.user._id;
 * }
 * 
 * After:
 */
export async function exampleVisitsEndpoint(req) {
  // For sales users, fetch from their account + any linked old accounts
  if (req.user.role === 'sales') {
    const userIds = await getLinkedUserIds(req.user._id);
    return { userId: { $in: userIds } };
  }
  return {};
}

/**
 * EXAMPLE 2: Get all reports for user + linked accounts (reports.js)
 * 
 * Usage:
 */
export async function exampleReportsEndpoint(req) {
  if (req.user.role === 'sales') {
    const filter = await buildUserIdFilter(req.user._id, 'userId');
    return filter;
  }
  return {};
}

/**
 * EXAMPLE 3: Dashboard data - get summary from all accounts
 */
export async function exampleDashboardEndpoint(req) {
  const userIds = await getLinkedUserIds(req.user._id);
  
  // Now you can use userIds in any MongoDB query:
  // Visit.find({ userId: { $in: userIds } })
  // Report.find({ userId: { $in: userIds } })
  // Planner.find({ userId: { $in: userIds } })
  // Lead.find({ userId: { $in: userIds } })
  
  return userIds;
}

/**
 * Quick Implementation Checklist:
 * 
 * 1. Import the service at the top of the route file:
 *    import { getLinkedUserIds, buildUserIdFilter } from '../services/userLinkingService.js';
 * 
 * 2. In GET endpoints that filter by userId, update the query building logic:
 *    
 *    OLD:
 *    if (req.user.role === 'sales') {
 *      query.userId = req.user._id;
 *    }
 *    
 *    NEW:
 *    if (req.user.role === 'sales') {
 *      const userIds = await getLinkedUserIds(req.user._id);
 *      query.userId = { $in: userIds };
 *    }
 * 
 * 3. For pagination endpoints, use buildUserIdFilter:
 *    const filter = await buildUserIdFilter(req.user._id, 'userId');
 *    const query = { ...filter, ...otherFilters };
 * 
 * 4. Test with a linked account user:
 *    - Old records should now be accessible via the new account
 *    - Dashboard numbers should include both old and new account data
 * 
 * Files that typically need updating:
 * - src/routes/visits.js    (get all visits, single visit)
 * - src/routes/reports.js   (get all reports, dashboards)
 * - src/routes/planners.js  (get all planners)
 * - src/routes/leads.js     (get all leads)
 * - src/routes/dashboard.js (summary endpoints)
 */

export default {
  exampleVisitsEndpoint,
  exampleReportsEndpoint,
  exampleDashboardEndpoint
};
