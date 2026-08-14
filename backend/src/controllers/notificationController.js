const { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } = require('../services/notificationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function getNotifications(req, res) {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await getUserNotifications(req.user._id, { unreadOnly });
    const unreadCount = await getUnreadCount(req.user._id);
    return successResponse(res, { notifications, unreadCount }, 'Notifications fetched');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
}

async function markRead(req, res) {
  try {
    const notif = await markAsRead(req.params.id, req.user._id);
    if (!notif) return errorResponse(res, 'Notification not found', 404, 'NOT_FOUND');
    return successResponse(res, { notification: notif }, 'Marked as read');
  } catch (err) {
    return errorResponse(res, 'Failed to update notification', 500);
  }
}

async function markAllRead(req, res) {
  try {
    await markAllAsRead(req.user._id);
    return successResponse(res, {}, 'All notifications marked as read');
  } catch (err) {
    return errorResponse(res, 'Failed to update notifications', 500);
  }
}

module.exports = { getNotifications, markRead, markAllRead };
