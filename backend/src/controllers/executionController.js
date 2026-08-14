const { runCode, getUserExecutionHistory, LANGUAGE_IDS } = require('../services/executionService');
const { log } = require('../services/activityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const TestCase = require('../models/TestCase');

// POST /api/execution/run
async function run(req, res) {
  try {
    const { sourceCode, language, stdin = '', roomId, projectId } = req.body;

    if (!sourceCode || !language) {
      return errorResponse(res, 'sourceCode and language are required', 400, 'VALIDATION_ERROR');
    }

    if (!LANGUAGE_IDS[language]) {
      return errorResponse(res, `Language "${language}" not supported`, 400, 'UNSUPPORTED_LANGUAGE');
    }

    const result = await runCode({
      sourceCode,
      language,
      stdin,
      userId: req.user._id,
      roomId: roomId || null,
      projectId: projectId || null,
    });

    await log({ userId: req.user._id, action: 'code_run', resource: 'execution', meta: { language } });

    if (!result.success) {
      return errorResponse(res, result.message, 503, 'EXECUTION_FAILED');
    }

    return successResponse(res, { result }, 'Code executed');
  } catch (err) {
    return errorResponse(res, 'Execution failed', 500);
  }
}

// POST /api/execution/run-tests
async function runTests(req, res) {
  try {
    const { sourceCode, language, testCaseIds } = req.body;

    if (!sourceCode || !language || !testCaseIds?.length) {
      return errorResponse(res, 'sourceCode, language, and testCaseIds are required', 400, 'VALIDATION_ERROR');
    }

    const testCases = await TestCase.find({ _id: { $in: testCaseIds } });
    if (!testCases.length) return errorResponse(res, 'No test cases found', 404, 'NOT_FOUND');

    const results = [];
    for (const tc of testCases) {
      const result = await runCode({ sourceCode, language, stdin: tc.input, userId: req.user._id });
      const actual = (result.stdout || '').trim();
      const expected = (tc.expectedOutput || '').trim();
      const passed = actual === expected;

      await TestCase.findByIdAndUpdate(tc._id, {
        lastResult: {
          input: tc.input,
          expectedOutput: expected,
          actualOutput: actual,
          passed,
          status: result.status,
          executionTime: result.executionTime,
        },
      });

      results.push({
        testCaseId: tc._id,
        label: tc.label,
        passed,
        status: result.status,
        input: tc.input,
        expected,
        actual,
        executionTime: result.executionTime,
        error: result.stderr || result.compileOutput || null,
      });
    }

    const passed = results.filter((r) => r.passed).length;
    return successResponse(res, { results, summary: { total: results.length, passed, failed: results.length - passed } }, 'Tests run');
  } catch (err) {
    return errorResponse(res, 'Test execution failed', 500);
  }
}

// GET /api/execution/history
async function history(req, res) {
  try {
    const records = await getUserExecutionHistory(req.user._id);
    return successResponse(res, { records }, 'Execution history');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch history', 500);
  }
}

module.exports = { run, runTests, history };
