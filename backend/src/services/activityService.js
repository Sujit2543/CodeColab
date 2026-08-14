const ActivityLog = require('../models/ActivityLog');

async function log({ userId, action, resource = '', resourceId = '', meta = {}, ip = '' }) {
  try {
    await ActivityLog.create({ user: userId, action, resource, resourceId, meta, ip });
  } catch (err) {
    // Non-critical — don't crash the app
  }
}

async function getUserActivity(userId, limit = 50) {
  return ActivityLog.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
}

async function getStats(userId) {
  const pipeline = [
    { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
  ];
  const results = await ActivityLog.aggregate(pipeline);
  return results.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
}

module.exports = { log, getUserActivity, getStats };
