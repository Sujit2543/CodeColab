const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  actualOutput: String,
  passed: Boolean,
  status: String,
  executionTime: Number,
}, { _id: false });

const testCaseSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    label: { type: String, required: true },
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    isHidden: { type: Boolean, default: false },
    language: { type: String, default: 'javascript' },
    lastResult: { type: testResultSchema, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestCase', testCaseSchema);
