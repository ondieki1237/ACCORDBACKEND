import CallLog from '../models/CallLog.js';
import logger from '../utils/logger.js';

// Create a new call log
export const createCallLog = async (req, res) => {
  try {
    const {
      clientName,
      clientPhone,
      callDirection,
      callDate,
      callTime,
      callDuration,
      callOutcome,
      callType,
      nextAction,
      followUpDate,
      callNotes,
      tags,
      facilityName,
      facilityLocation,
      contactPerson,
      productInterest,
      expectedPurchaseDate,
      machineModel,
      machineSerialNumber,
      serviceAccepted,
      serviceRequestType,
      year,
      month,
      week
    } = req.body;

    // Validate required fields
    if (!clientName || !clientPhone || !callDirection || !callDate || !callTime || callDuration === undefined || !callOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientName, clientPhone, callDirection, callDate, callTime, callDuration, callOutcome'
      });
    }

    // Create call log object
    const callLogData = {
      clientName,
      clientPhone,
      callDirection,
      callDate: new Date(callDate),
      callTime,
      callDuration,
      callOutcome,
      callType: callType || 'general',
      nextAction: nextAction || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      callNotes: callNotes || '',
      tags: tags || [],
      createdBy: req.user._id,
      // Telesales specific fields
      facilityName: facilityName || clientName,
      facilityLocation: facilityLocation || null,
      contactPerson: contactPerson || null,
      productInterest: productInterest || null,
      expectedPurchaseDate: expectedPurchaseDate ? new Date(expectedPurchaseDate) : null,
      machineModel: machineModel || null,
      machineSerialNumber: machineSerialNumber || null,
      serviceAccepted: serviceAccepted !== undefined ? serviceAccepted : null,
      serviceRequestType: serviceRequestType || null
    };

    // Allow override of year, month, week if provided (for testing purposes)
    if (year) callLogData.year = year;
    if (month) callLogData.month = month;
    if (week) callLogData.week = week;

    // Create call log
    const callLog = new CallLog(callLogData);
    await callLog.save();

    // Populate user data
    await callLog.populate('createdBy', 'firstName lastName email role');

    logger.info(`Call log created by user ${req.user._id} for facility ${facilityName || clientName}`);

    res.status(201).json({
      success: true,
      message: 'Call log created successfully',
      data: callLog
    });
  } catch (error) {
    logger.error('Error creating call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create call log',
      error: error.message
    });
  }
};

// Get all call logs with pagination and filtering
export const getCallLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      year,
      month,
      week,
      callOutcome,
      callDirection,
      callType,
      facilityName,
      clientName,
      search,
      startDate,
      endDate,
      createdBy,
      serviceAccepted
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (week) query.week = parseInt(week);
    if (callOutcome) query.callOutcome = callOutcome;
    if (callDirection) query.callDirection = callDirection;
    if (callType) query.callType = callType;
    if (createdBy) query.createdBy = createdBy;

    // Telesales filters
    if (facilityName) {
      query.facilityName = { $regex: facilityName, $options: 'i' };
    }
    if (clientName) {
      query.clientName = { $regex: clientName, $options: 'i' };
    }
    if (serviceAccepted !== undefined) {
      query.serviceAccepted = serviceAccepted === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) query.callDate.$gte = new Date(startDate);
      if (endDate) query.callDate.$lte = new Date(endDate);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { callDate: -1, createdAt: -1 },
      populate: [
        { path: 'createdBy', select: 'firstName lastName email role' },
        { path: 'relatedLead', select: 'facilityName leadStatus' },
        { path: 'relatedVisit', select: 'client.name visitPurpose' }
      ]
    };

    const callLogs = await CallLog.paginate(query, options);

    res.json({
      success: true,
      data: callLogs.docs,
      pagination: {
        total: callLogs.totalDocs,
        page: callLogs.page,
        pages: callLogs.totalPages,
        limit: callLogs.limit
      }
    });
  } catch (error) {
    logger.error('Error fetching call logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call logs',
      error: error.message
    });
  }
};

// Get folder tree structure (years, months, weeks)
export const getFolderTree = async (req, res) => {
  try {
    const { userId } = req.query;

    // Build query - admins see all, users see their own
    const query = { isActive: true };
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.createdBy = req.user._id;
    } else if (userId) {
      query.createdBy = userId;
    }

    // Aggregate to get unique year/month/week combinations with counts
    const tree = await CallLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            week: '$week'
          },
          count: { $sum: 1 },
          firstCall: { $min: '$callDate' },
          lastCall: { $max: '$callDate' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1 } }
    ]);

    // Organize into hierarchical structure
    const folderTree = {};

    tree.forEach(item => {
      const { year, month, week } = item._id;
      
      if (!folderTree[year]) {
        folderTree[year] = {
          year,
          months: {},
          totalCalls: 0
        };
      }

      if (!folderTree[year].months[month]) {
        folderTree[year].months[month] = {
          month,
          monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
          weeks: {},
          totalCalls: 0
        };
      }

      folderTree[year].months[month].weeks[week] = {
        week,
        count: item.count,
        firstCall: item.firstCall,
        lastCall: item.lastCall
      };

      folderTree[year].months[month].totalCalls += item.count;
      folderTree[year].totalCalls += item.count;
    });

    // Convert to array format
    const result = Object.values(folderTree).map(yearData => ({
      year: yearData.year,
      totalCalls: yearData.totalCalls,
      months: Object.values(yearData.months).map(monthData => ({
        month: monthData.month,
        monthName: monthData.monthName,
        totalCalls: monthData.totalCalls,
        weeks: Object.values(monthData.weeks).sort((a, b) => a.week - b.week)
      }))
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching folder tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder tree',
      error: error.message
    });
  }
};

// Get a single call log by ID
export const getCallLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const callLog = await CallLog.findById(id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('relatedLead', 'facilityName leadStatus contactPerson')
      .populate('relatedVisit', 'client.name visitPurpose visitOutcome');

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        callLog.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: callLog
    });
  } catch (error) {
    logger.error('Error fetching call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call log',
      error: error.message
    });
  }
};

// Update a call log
export const updateCallLog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the call log
    const callLog = await CallLog.findById(id);

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        callLog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    const allowedUpdates = [
      'clientName', 'clientPhone', 'callDirection', 'callDate', 'callTime',
      'callDuration', 'callOutcome', 'nextAction', 'followUpDate',
      'callNotes', 'tags', 'relatedLead', 'relatedVisit'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        callLog[field] = updates[field];
      }
    });

    await callLog.save();
    await callLog.populate('createdBy', 'firstName lastName email role');

    logger.info(`Call log ${id} updated by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Call log updated successfully',
      data: callLog
    });
  } catch (error) {
    logger.error('Error updating call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call log',
      error: error.message
    });
  }
};

// Delete a call log (soft delete)
export const deleteCallLog = async (req, res) => {
  try {
    const { id } = req.params;

    const callLog = await CallLog.findById(id);

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: 'Call log not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && 
        callLog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    callLog.isActive = false;
    await callLog.save();

    logger.info(`Call log ${id} deleted by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Call log deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete call log',
      error: error.message
    });
  }
};

// Get call statistics
export const getCallStatistics = async (req, res) => {
  try {
    const { year, month, week, userId } = req.query;

    // Build query
    const query = { isActive: true };
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (week) query.week = parseInt(week);

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.createdBy = req.user._id;
    } else if (userId) {
      query.createdBy = userId;
    }

    // Get statistics
    const stats = await CallLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$callDuration' },
          avgDuration: { $avg: '$callDuration' },
          inboundCalls: {
            $sum: { $cond: [{ $eq: ['$callDirection', 'inbound'] }, 1, 0] }
          },
          outboundCalls: {
            $sum: { $cond: [{ $eq: ['$callDirection', 'outbound'] }, 1, 0] }
          },
          noAnswer: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'no_answer'] }, 1, 0] }
          },
          interested: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'interested'] }, 1, 0] }
          },
          followUpNeeded: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'follow_up_needed'] }, 1, 0] }
          },
          notInterested: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'not_interested'] }, 1, 0] }
          },
          saleClosed: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'sale_closed'] }, 1, 0] }
          }
        }
      }
    ]);

    const statistics = stats.length > 0 ? stats[0] : {
      totalCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
      inboundCalls: 0,
      outboundCalls: 0,
      noAnswer: 0,
      interested: 0,
      followUpNeeded: 0,
      notInterested: 0,
      saleClosed: 0
    };

    // Calculate conversion rate
    const totalAnswered = statistics.totalCalls - statistics.noAnswer;
    statistics.conversionRate = totalAnswered > 0 
      ? ((statistics.saleClosed / totalAnswered) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error fetching call statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call statistics',
      error: error.message
    });
  }
};

// Get upcoming follow-ups
export const getUpcomingFollowUps = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const query = {
      isActive: true,
      callOutcome: 'follow_up_needed',
      followUpDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000)
      }
    };

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.createdBy = req.user._id;
    }

    const followUps = await CallLog.find(query)
      .sort({ followUpDate: 1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('relatedLead', 'facilityName leadStatus')
      .limit(50);

    res.json({
      success: true,
      data: followUps
    });
  } catch (error) {
    logger.error('Error fetching upcoming follow-ups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming follow-ups',
      error: error.message
    });
  }
};

// Get call history for telesales (by facility name - optional)
export const getTelesalesCallHistory = async (req, res) => {
  try {
    const { facilityName, page = 1, limit = 50 } = req.query;

    const query = {
      isActive: true
    };

    // Filter by facility if provided
    if (facilityName) {
      query.$or = [
        { facilityName: { $regex: facilityName, $options: 'i' } },
        { clientName: { $regex: facilityName, $options: 'i' } }
      ];
    }

    // Non-admin users only see their own calls
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.createdBy = req.user._id;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { callDate: -1 },
      populate: [{
        path: 'createdBy',
        select: 'firstName lastName email role'
      }]
    };

    const callHistory = await CallLog.paginate(query, options);

    res.json({
      success: true,
      data: callHistory.docs,
      pagination: {
        total: callHistory.totalDocs,
        page: callHistory.page,
        pages: callHistory.totalPages,
        limit: callHistory.limit
      }
    });
  } catch (error) {
    logger.error('Error fetching telesales call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telesales call history',
      error: error.message
    });
  }
};

// Get telesales summary statistics
export const getTelesalesSummary = async (req, res) => {
  try {
    const { facilityName, startDate, endDate } = req.query;

    const query = { isActive: true };

    if (facilityName) {
      query.$or = [
        { facilityName: { $regex: facilityName, $options: 'i' } },
        { clientName: { $regex: facilityName, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.callDate = {};
      if (startDate) query.callDate.$gte = new Date(startDate);
      if (endDate) query.callDate.$lte = new Date(endDate);
    }

    // Non-admin users only see their own data
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.createdBy = req.user._id;
    }

    const stats = await CallLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$callDuration' },
          avgDuration: { $avg: '$callDuration' },
          callsByType: {
            $push: {
              type: '$callType',
              count: 1
            }
          },
          callsByOutcome: {
            $push: {
              outcome: '$callOutcome',
              count: 1
            }
          },
          productInquiries: {
            $sum: { $cond: [{ $eq: ['$callType', 'product_inquiry'] }, 1, 0] }
          },
          serviceInquiries: {
            $sum: { $cond: [{ $eq: ['$callType', 'service_inquiry'] }, 1, 0] }
          },
          machineInquiries: {
            $sum: { $cond: [{ $eq: ['$callType', 'machine_inquiry'] }, 1, 0] }
          },
          followUps: {
            $sum: { $cond: [{ $eq: ['$callType', 'follow_up'] }, 1, 0] }
          },
          interested: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'interested'] }, 1, 0] }
          },
          saleClosed: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'sale_closed'] }, 1, 0] }
          },
          followUpNeeded: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'follow_up_needed'] }, 1, 0] }
          },
          noAnswer: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'no_answer'] }, 1, 0] }
          },
          notInterested: {
            $sum: { $cond: [{ $eq: ['$callOutcome', 'not_interested'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats.length > 0 ? stats[0] : {
      totalCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
      productInquiries: 0,
      serviceInquiries: 0,
      machineInquiries: 0,
      followUps: 0,
      interested: 0,
      saleClosed: 0,
      followUpNeeded: 0,
      noAnswer: 0,
      notInterested: 0
    };

    // Calculate conversion and success rates
    summary.conversionRate = summary.totalCalls > 0 
      ? ((summary.saleClosed / summary.totalCalls) * 100).toFixed(2)
      : 0;

    summary.interestRate = summary.totalCalls > 0
      ? (((summary.interested + summary.saleClosed) / summary.totalCalls) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching telesales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telesales summary',
      error: error.message
    });
  }
};
