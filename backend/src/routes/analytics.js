const express = require('express');
const { protect } = require('../middleware/auth');
const { getUserStats, getActivity } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/stats', protect, getUserStats);
router.get('/activity', protect, getActivity);

module.exports = router;
