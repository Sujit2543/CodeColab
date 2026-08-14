const mongoose = require('mongoose');

const codeExecutionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    stdin: { type: String, default: '' },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    compileOutput: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    statusId: { type: Number, default: null },
    executionTime: { type: Number, default: null },
    memoryUsed: { type: Number, default: null },
    exitCode: { type: Number, default: null },
  },
  { timestamps: true }
);

codeExecutionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CodeExecution', codeExecutionSchema);
