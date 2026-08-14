const express = require('express');
const { protect } = require('../middleware/auth');
const { run, runTests, history } = require('../controllers/executionController');

const router = express.Router();

router.post('/run', protect, run);
router.post('/run-tests', protect, runTests);
router.get('/history', protect, history);

module.exports = router;
