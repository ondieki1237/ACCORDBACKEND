import Communication from '../models/Communication.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Create a message (group or personal)
export async function createMessage(req, res) {
  try {
    const { type, recipients = [], subject, content, attachments = [], meta } = req.body;
    if (!type || !content) return res.status(400).json({ success: false, message: 'type and content are required' });

    if (type === 'personal' && (!Array.isArray(recipients) || recipients.length === 0)) {
      return res.status(400).json({ success: false, message: 'recipients required for personal messages' });
    }

    const comm = new Communication({
      type,
      recipients: type === 'personal' ? recipients : [],
      sender: req.user._id,
      subject,
      content,
      attachments,
      meta
    });

    await comm.save();
    const populated = await Communication.findById(comm._id)
      .populate('sender', 'firstName lastName email role')
      .populate('recipients', 'firstName lastName email role')
      .lean();

    // emit socket event to clients if needed
    try {
      const io = req.app.get('io');
      if (io) {
        if (type === 'group') io.emit('communications:group:new', populated);
        else {
          // notify recipients individually
          (recipients || []).forEach(rId => io.to(String(rId)).emit('communications:personal:new', populated));
          // also notify sender room
          io.to(String(req.user._id)).emit('communications:personal:new', populated);
        }
      }
    } catch (e) {
      logger.warn('Socket emit failed for communication', e);
    }

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('createMessage error', err);
    return res.status(500).json({ success: false, message: 'Failed to create message' });
  }
}

// Get personal messages relevant to the current user (inbox)
export async function getMyCommunications(req, res) {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0 } = req.query;

    const query = {
      type: 'personal',
      $or: [
        { recipients: userId },
        { sender: userId }
      ]
    };

    const messages = await Communication.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('sender', 'firstName lastName email role')
      .populate('recipients', 'firstName lastName email role')
      .lean();

    return res.json({ success: true, data: messages });
  } catch (err) {
    logger.error('getMyCommunications error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch communications' });
  }
}

// Get group messages (single global group)
export async function getGroupMessages(req, res) {
  try {
    const { limit = 100, since } = req.query;
    const q = { type: 'group' };
    if (since) q.createdAt = { $gt: new Date(since) };

    const messages = await Communication.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'firstName lastName email role')
      .lean();

    return res.json({ success: true, data: messages });
  } catch (err) {
    logger.error('getGroupMessages error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch group messages' });
  }
}

// Get personal conversation between me and another user (one-to-one)
export async function getPersonalConversation(req, res) {
  try {
    const userId = req.user._id;
    const otherId = req.params.userId;
    const { limit = 100 } = req.query;

    const q = {
      type: 'personal',
      $or: [
        { sender: userId, recipients: otherId },
        { sender: otherId, recipients: userId },
        // support multiple recipients where both participants included
        { sender: userId, recipients: { $all: [otherId] } },
        { sender: otherId, recipients: { $all: [userId] } }
      ]
    };

    const messages = await Communication.find(q)
      .sort({ createdAt: 1 })
      .limit(Number(limit))
      .populate('sender', 'firstName lastName email role')
      .populate('recipients', 'firstName lastName email role')
      .lean();

    return res.json({ success: true, data: messages });
  } catch (err) {
    logger.error('getPersonalConversation error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
}

// Mark message as read by current user
export async function markAsRead(req, res) {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const comm = await Communication.findByIdAndUpdate(id, { $addToSet: { readBy: userId } }, { new: true });
    if (!comm) return res.status(404).json({ success: false, message: 'Message not found' });
    return res.json({ success: true, data: comm });
  } catch (err) {
    logger.error('markAsRead error', err);
    return res.status(500).json({ success: false, message: 'Failed to mark read' });
  }
}

// List users for UI (id, firstName, lastName, email, role)
export async function listUsers(req, res) {
  try {
    const users = await User.find({}, 'firstName lastName email role').lean();
    return res.json({ success: true, data: users });
  } catch (err) {
    logger.error('listUsers error', err);
    return res.status(500).json({ success: false, message: 'Failed to list users' });
  }
}