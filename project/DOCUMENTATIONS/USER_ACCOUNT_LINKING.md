# User Account Linking Implementation Guide

## Overview
This system allows users with linked accounts to access data from their old/previous accounts seamlessly. Perfect for account migrations, employee transfers, or consolidating duplicate accounts.

## Quick Start

### 1. Link Two User Accounts
```bash
node scripts/linkUserAccounts.js <newUserId> <oldUserId> [reason] [notes]
```

Example:
```bash
node scripts/linkUserAccounts.js 69ae361a26f70ed0678f8e0e 6964ae881b37f2200e0fc7f9 account_migration "User migrated to new account"
```

This creates a link even if the old user no longer exists as a User document!

### 2. Update API Endpoints
Import and use the linking service in your routes:

```javascript
import { getLinkedUserIds, buildUserIdFilter } from '../services/userLinkingService.js';
```

## Implementation Examples

### For GET /visits Endpoint
**Before:**
```javascript
if (req.user.role === 'sales') {
  query.userId = req.user._id;
}
```

**After:**
```javascript
if (req.user.role === 'sales') {
  const userIds = await getLinkedUserIds(req.user._id);
  query.userId = { $in: userIds };
}
```

### For Paginated Endpoints
```javascript
const filter = await buildUserIdFilter(req.user._id, 'userId');
const query = { ...filter, ...otherFilters };
const options = { page: parseInt(page), limit: parseInt(limit) };
const results = await Model.paginate(query, options);
```

### For Dashboard Summaries
```javascript
const userIds = await getLinkedUserIds(req.user._id);

const visitCount = await Visit.countDocuments({ userId: { $in: userIds } });
const reportCount = await Report.countDocuments({ userId: { $in: userIds } });
const plannerCount = await Planner.countDocuments({ userId: { $in: userIds } });
```

## Service API Reference

### getLinkedUserIds(userId)
Returns array of user IDs (current user + all linked old user IDs)
```javascript
const userIds = await getLinkedUserIds(userId);
// Returns: [userId, oldUserId1, oldUserId2, ...]
```

### getUserLink(newUserId, oldUserId)
Get link info between two users
```javascript
const link = await getUserLink(newUserId, oldUserId);
// Returns: { _id, newUserId, oldUserId, reason, linkedAt, notes }
```

### getLinkedOldUsers(newUserId)
Get list of all linked old accounts
```javascript
const oldAccounts = await getLinkedOldUsers(newUserId);
// Returns: [{ user: {...}, reason, linkedAt, notes }, ...]
```

### deactivateUserLink(newUserId, oldUserId)
Stop sharing data from old account
```javascript
const success = await deactivateUserLink(newUserId, oldUserId);
```

### reactivateUserLink(newUserId, oldUserId)
Resume sharing data from old account
```javascript
const success = await reactivateUserLink(newUserId, oldUserId);
```

### hasLinkedAccounts(userId)
Check if user has any linked old accounts
```javascript
const hasLinks = await hasLinkedAccounts(userId);
// Returns: boolean
```

### buildUserIdFilter(userId, fieldName)
Build MongoDB filter for $in queries
```javascript
const filter = await buildUserIdFilter(userId, 'userId');
// Returns: { userId: { $in: [userId, linkedIds...] } }

// Use in queries:
const docs = await Model.find(filter);
```

## Database Schema

### UserLink Collection
```javascript
{
  _id: ObjectId,
  newUserId: ObjectId,           // Current user
  oldUserId: ObjectId,           // Old/previous user
  reason: String,                // Why linked (enum)
  linkedBy: ObjectId,            // Admin who created link
  notes: String,                 // Additional info
  isActive: Boolean,             // Link active status
  createdAt: Date,               // When link created
  updatedAt: Date
}
```

Supported reasons:
- `account_migration` - User got new account
- `account_consolidation` - Consolidating duplicate accounts
- `duplicate_account` - Merging duplicate accounts
- `other` - Custom reason

## Common Use Cases

### User Migration
```javascript
// User got deleted, create link with orphaned data
await linkUserAccounts(newUserId, oldUserId, 'account_migration', 
  'Data from deleted account');
```

### Employee Transfer
```javascript
// Transfer all records from old team account to new one
await linkUserAccounts(newTeamUserId, oldTeamUserId, 'employee_transfer',
  'Employee transferred to new team');
```

### Account Consolidation
```javascript
// Merge multiple duplicates into one account
await linkUserAccounts(mainUserId, duplicateUserId, 'duplicate_account',
  'Consolidated duplicate account #1');
```

## Migration Checklist

To fully implement linked account support:

### Phase 1: Core (✅ Done)
- [x] Create UserLink model
- [x] Create userLinkingService with all utilities
- [x] Create linkUserAccounts script

### Phase 2: API Updates (Todo)
- [ ] Update `/api/visits` GET endpoint
- [ ] Update `/api/reports` GET endpoint  
- [ ] Update `/api/planners` GET endpoint
- [ ] Update `/api/leads` GET endpoint
- [ ] Update dashboard endpoints
- [ ] Update analytics endpoints

### Phase 3: UI Features (Optional)
- [ ] Show "Linked Accounts" in user profile
- [ ] Add endpoint to view linked accounts
- [ ] Add endpoint to manage links (deactivate/reactivate)
- [ ] Show data source in list views (current vs linked)

## Endpoint Template

For consistency, here's the template to use when updating endpoints:

```javascript
// @route   GET /api/resource
// @desc    Get resources for current user (including linked accounts)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;

    const query = {};
    
    // Include linked accounts
    if (req.user.role === 'sales') {
      const userIds = await getLinkedUserIds(req.user._id);
      query.userId = { $in: userIds };
    }

    // Add other filters
    // ...

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'userId', select: 'firstName lastName' }
    };

    const results = await Model.paginate(query, options);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    // error handling...
  }
});
```

## Notes

- Links work even if old user document no longer exists
- Multiple old accounts can be linked to one new account
- Bidirectional lookups are supported
- Links can be temporarily deactivated without deletion
- All operations are logged with timestamps
- Service is efficient with proper MongoDB indexes

## Troubleshooting

**Q: User can't see old data**
A: Ensure the endpoint has been updated to use `getLinkedUserIds()`. Check that the link exists:
```javascript
const link = await UserLink.findOne({ newUserId, oldUserId });
```

**Q: Duplicate records appearing**
A: If old user still has userId field in records, they'll appear twice. Consider migrating data:
```javascript
// Migrate all records from old user to new
await Visit.updateMany({ userId: oldUserId }, { $set: { userId: newUserId } });
```

**Q: Link not working for non-sales users**
A: Service works for all roles. Make sure your endpoint calls `getLinkedUserIds()` unconditionally if needed:
```javascript
const userIds = await getLinkedUserIds(req.user._id);
// Use in query regardless of role
```

## Support

For issues or questions about the linking system, check:
1. `src/models/UserLink.js` - Schema definition
2. `src/services/userLinkingService.js` - Service implementation  
3. `src/services/userLinkingService.example.js` - Implementation examples
