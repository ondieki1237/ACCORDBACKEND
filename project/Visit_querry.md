Visits Backend — Implementation Guide

Purpose

This file provides a ready-to-drop-in Express + Mongoose implementation for the missing endpoint GET /api/admin/visits (used by the frontend export and admin listing). It includes:

- Behavior and query params
- Mongoose aggregation pipeline (to support user region filtering)
- Example controller and route code (JavaScript)
- Validation and recommended DB indexes
- Curl examples and sample responses

Goal

Implement an admin-only endpoint that returns paginated visits and supports filtering by date range, client name, contact name, outcome, tag, userId, region, and sorting. The endpoint should return a standard shape:

{ success: true, data: [Visit], meta: { totalDocs, limit, page, totalPages, hasNextPage, hasPrevPage } }


1) Route summary

GET /api/admin/visits
- Query params:
  - page (default 1)
  - limit (default 25)
  - startDate (YYYY-MM-DD or ISO)
  - endDate (YYYY-MM-DD or ISO)
  - clientName (partial match)
  - contactName (partial match)
  - outcome (exact match string)
  - tag (exact tag string)
  - sort (e.g. -date or date)
  - userId (ObjectId)
  - region (user.region)

Populates: `userId` (select _id, firstName, lastName, email, role, employeeId, region) where applicable

Permissions: Admin only (attach your existing isAdmin middleware)

Notes:
- The frontend may request large `limit` (e.g. 10000) for exports. Use sensible server limits / safety checks in production.


2) Mongoose / Express controller (JavaScript)

Place this file in your backend (example: `controllers/adminVisitsController.js`) and wire it to your admin router.

// controllers/adminVisitsController.js

const mongoose = require('mongoose');
const Visit = require('../models/Visit'); // adjust path

// Helper to parse ISO or YYYY-MM-DD to Date at start of day
function parseDateStart(d) {
  if (!d) return null;
  const dt = new Date(d);
  dt.setHours(0,0,0,0);
  return dt;
}
function parseDateEnd(d) {
  if (!d) return null;
  const dt = new Date(d);
  dt.setHours(23,59,59,999);
  return dt;
}

exports.listAdminVisits = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      startDate,
      endDate,
      clientName,
      contactName,
      outcome,
      tag,
      sort,
      userId,
      region,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(10000, Math.max(1, parseInt(limit, 10) || 25));

    // Base match using fields stored on Visit document
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = parseDateStart(startDate);
      if (endDate) match.date.$lte = parseDateEnd(endDate);
    }
    if (clientName) match['client.name'] = { $regex: clientName, $options: 'i' };
    if (contactName) match['contacts.name'] = { $regex: contactName, $options: 'i' };
    if (outcome) match.visitOutcome = outcome;
    if (tag) match.tags = tag; // exact tag; for partial tag matching use $regex
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) match.userId = mongoose.Types.ObjectId(userId);
    }

    // Build aggregation pipeline to allow filtering by user.region (stored on users collection)
    const pipeline = [
      { $match: match },
      // Bring in user fields
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ];

    // If region filter is present, filter after lookup
    if (region) {
      pipeline.push({ $match: { 'user.region': region } });
    }

    // Optional sort
    if (sort) {
      // support '-date' for descending
      const s = {};
      const key = sort.startsWith('-') ? sort.slice(1) : sort;
      s[key] = sort.startsWith('-') ? -1 : 1;
      pipeline.push({ $sort: s });
    } else {
      pipeline.push({ $sort: { date: -1, createdAt: -1 } });
    }

    // Facet for data + count
    pipeline.push({
      $facet: {
        data: [
          { $skip: (pageNum - 1) * perPage },
          { $limit: perPage }
        ],
        totalCount: [ { $count: 'count' } ]
      }
    });

    // Execute aggregate
    const aggResult = await Visit.aggregate(pipeline).allowDiskUse(true).exec();
    const data = (aggResult[0] && aggResult[0].data) || [];
    const totalCount = (aggResult[0] && aggResult[0].totalCount[0] && aggResult[0].totalCount[0].count) || 0;

    // Replace `user` subdocument with `user` projection (keep only selected fields)
    const transformed = data.map((v) => {
      // if you want to rename user -> userId with limited fields
      if (v.user) {
        v.userId = {
          _id: v.user._id,
          firstName: v.user.firstName,
          lastName: v.user.lastName,
          email: v.user.email,
          role: v.user.role,
          employeeId: v.user.employeeId,
          region: v.user.region,
        };
      }
      // remove the joined `user` wrapper to match Visit schema
      delete v.user;
      return v;
    });

    const totalPages = Math.ceil(totalCount / perPage) || 1;

    return res.json({
      success: true,
      data: transformed,
      meta: {
        totalDocs: totalCount,
        limit: perPage,
        page: pageNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      }
    });

  } catch (err) {
    console.error('listAdminVisits error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


3) GET /api/admin/visits/:id (full visit)

// controllers/adminVisitsController.js (add)
exports.getAdminVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success:false, message:'Invalid id' });

    const visit = await Visit.findById(id)
      .populate('userId', '_id firstName lastName email role employeeId region')
      .populate('followUpVisits')
      .populate('followUpActions.assignedTo', '_id firstName lastName email')
      .lean();

    if (!visit) return res.status(404).json({ success:false, message:'Visit not found' });

    return res.json({ success: true, data: visit });
  } catch (err) {
    console.error('getAdminVisitById error', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
};


4) Wiring into routes

// routes/admin.js (or your admin router file)

const express = require('express');
const router = express.Router();
const adminVisitsController = require('../controllers/adminVisitsController');
const { isAdmin } = require('../middleware/auth'); // your auth middleware

router.get('/visits', isAdmin, adminVisitsController.listAdminVisits);
router.get('/visits/:id', isAdmin, adminVisitsController.getAdminVisitById);

module.exports = router;

Mount admin router under /api/admin in your app: `app.use('/api/admin', adminRouter);`


5) Recommended DB indexes

- { date: 1 } — range queries by date
- { userId: 1 } — filter by user
- { 'client.name': 'text' } or index for prefix searches
- { tags: 1 } — tag lookup
- Compound indexes where common (e.g., { date: 1, userId: 1 }) depending on queries


6) Validation (recommended)

Use `joi` or `express-validator` to validate query parameters early. Example using `joi`:

const Joi = require('joi');
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10000).default(25),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  clientName: Joi.string().optional(),
  contactName: Joi.string().optional(),
  outcome: Joi.string().optional(),
  tag: Joi.string().optional(),
  sort: Joi.string().optional(),
  userId: Joi.string().optional(),
  region: Joi.string().optional()
});

// then in route: const { value, error } = querySchema.validate(req.query);


7) Curl examples

Fetch visits between two dates (export use-case):

curl -G "http://localhost:4500/api/admin/visits" \
  --data-urlencode "startDate=2026-01-11" \
  --data-urlencode "endDate=2026-01-13" \
  --data-urlencode "limit=10000" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

Fetch paginated visits for a user:

curl -G "http://localhost:4500/api/admin/visits" \
  --data-urlencode "userId=643..." \
  --data-urlencode "page=1" \
  --data-urlencode "limit=25" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

Get full visit document:

curl "http://localhost:4500/api/admin/visits/603..." -H "Authorization: Bearer <ADMIN_TOKEN>"


8) Sample response (paginated)

{
  "success": true,
  "data": [
    {
      "_id": "601...",
      "visitId": "VIS-2026-0001",
      "date": "2026-01-12",
      "startTime": "09:00",
      "endTime": "10:00",
      "duration": 60,
      "client": { "name": "Acme Co", "type": "hospital", "level": "county", "location": "Nairobi" },
      "contacts": [],
      "visitPurpose": "Demo",
      "visitOutcome": "successful",
      "tags": ["priority"],
      "userId": { "_id": "643...", "firstName": "Enock", "lastName": "Ngugi", "email": "mburu...@gmail.com", "role": "sales", "employeeId": "EM003", "region": "Nairobi" },
      "createdAt": "2026-01-12T09:15:00.000Z"
    }
  ],
  "meta": { "totalDocs": 12, "limit": 10000, "page": 1, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}


9) Notes & tips

- The implementation uses aggregation to allow filtering on joined user fields (region). If you don't need region filtering, a simpler `Visit.find(match).populate('userId', ...)` approach with `.skip()`/`.limit()` and `countDocuments()` is fine.
- For very large exports consider a stream endpoint or server-side generation of CSV/XLSX to avoid huge in-memory blobs.
- Add rate limiting and admin-only checks for export endpoints to prevent abuse.


If you want, I can:
- Provide a TypeScript version of the controller (with typings)
- Create a streaming CSV endpoint that pipes data rather than returning a huge JSON
- Provide an example XLSX generation endpoint using `xlsx` (SheetJS) or `exceljs`

Tell me which variant you prefer and I will produce the matching code snippet ready to paste into your backend repository.
