const express = require('express');
const { protect } = require('../middleware/auth');
const { getTestCases, createTestCase, updateTestCase, deleteTestCase } = require('../controllers/testCaseController');

const router = express.Router();

router.get('/projects/:projectId', protect, getTestCases);
router.post('/projects/:projectId', protect, createTestCase);
router.put('/:id', protect, updateTestCase);
router.delete('/:id', protect, deleteTestCase);

module.exports = router;
