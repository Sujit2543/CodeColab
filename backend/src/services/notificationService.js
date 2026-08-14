const Notification = require('../models/Notification');

async function createNotification({ recipient, type, title, message, link = '', actor = null, meta = {} }) {
  if (!recipient || !type || !title || !message) return null;
  const notif = await Notification.create({ recipient, type, title, message, link, actor, meta });
  return notif;
}

async function getUserNotifications(userId, { limit = 30, unreadOnly = false } = {}) {
  const query = { recipient: userId };
  if (unreadOnly) query.read = false;
  return Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'username avatar');
}

async function markAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );
}

async function markAllAsRead(userId) {
  return Notification.updateMany({ recipient: userId, read: false }, { read: true });
}

async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead, getUnreadCount };
