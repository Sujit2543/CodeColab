const logger = require('../utils/logger');
const CodeExecution = require('../models/CodeExecution');

const JUDGE0_URL = 'https://ce.judge0.com';

const LANGUAGE_IDS = {
  javascript: 63, typescript: 74, python: 71, java: 62,
  cpp: 54, c: 50, go: 60, rust: 73, html: 43, css: 41, sql: 82,
};

const EXECUTION_TIMEOUT_MS = 15000;

async function runCode({ sourceCode, language, stdin = '', userId, roomId = null, projectId = null }) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return { success: false, message: `Language "${language}" is not supported` };
  }

  const record = await CodeExecution.create({
    user: userId,
    roomId,
    projectId,
    language,
    sourceCode,
    stdin,
    status: 'running',
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);

    const response = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: sourceCode, language_id: languageId, stdin }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Judge0 returned HTTP ${response.status}`);
    }

    const result = await response.json();

    await CodeExecution.findByIdAndUpdate(record._id, {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compileOutput: result.compile_output || '',
      status: result.status?.description || 'Unknown',
      statusId: result.status?.id || null,
      executionTime: result.time ? parseFloat(result.time) : null,
      memoryUsed: result.memory || null,
      exitCode: result.exit_code ?? null,
    });

    return {
      success: true,
      executionId: record._id,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compileOutput: result.compile_output || '',
      status: result.status?.description || 'Unknown',
      statusId: result.status?.id || null,
      executionTime: result.time,
      memoryUsed: result.memory,
    };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const message = isTimeout ? 'Execution timed out' : 'Execution service unavailable';

    await CodeExecution.findByIdAndUpdate(record._id, {
      status: message,
      stderr: message,
    });

    logger.error('Code execution error', { error: err.message, language, userId });
    return { success: false, message };
  }
}

async function getUserExecutionHistory(userId, limit = 20) {
  return CodeExecution.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-sourceCode');
}

module.exports = { runCode, getUserExecutionHistory, LANGUAGE_IDS };
