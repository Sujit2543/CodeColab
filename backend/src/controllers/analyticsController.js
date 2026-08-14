const { getUserActivity, getStats } = require('../services/activityService');
const CodeExecution = require('../models/CodeExecution');
const Project = require('../models/Project');
const Room = require('../models/Room');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function getUserStats(req, res) {
  try {
    const userId = req.user._id;

    const [projectCount, roomCount, execCount, activityStats] = await Promise.all([
      Project.countDocuments({ $or: [{ owner: userId }, { collaborators: userId }] }),
      Room.countDocuments({ $or: [{ owner: userId }, { 'participants.user': userId }] }),
      CodeExecution.countDocuments({ user: userId }),
      getStats(userId.toString()),
    ]);

    // Language breakdown from executions
    const langPipeline = [
      { $match: { user: userId } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];
    const langBreakdown = await CodeExecution.aggregate(langPipeline);

    return successResponse(res, {
      stats: {
        projectsCreated: projectCount,
        roomsJoined: roomCount,
        codeExecutions: execCount,
        ...activityStats,
      },
      languageBreakdown: langBreakdown,
    }, 'Stats fetched');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stats', 500);
  }
}

async function getActivity(req, res) {
  try {
    const activity = await getUserActivity(req.user._id, 50);
    return successResponse(res, { activity }, 'Activity fetched');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch activity', 500);
  }
}

module.exports = { getUserStats, getActivity };
