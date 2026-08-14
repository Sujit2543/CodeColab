import api from '../api/axios';

export const runCode = async ({ sourceCode, language, stdin = '', roomId, projectId }) => {
  const { data } = await api.post('/execution/run', { sourceCode, language, stdin, roomId, projectId });
  return data.result;
};

export const runTests = async ({ sourceCode, language, testCaseIds }) => {
  const { data } = await api.post('/execution/run-tests', { sourceCode, language, testCaseIds });
  return data;
};

export const getExecutionHistory = async () => {
  const { data } = await api.get('/execution/history');
  return data.records;
};
