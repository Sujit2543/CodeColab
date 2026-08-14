const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const versionSchema = new mongoose.Schema(
  {
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    savedBy: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      default: 'javascript',
      enum: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'html', 'css'],
    },
    code: {
      type: String,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: '',
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    versions: {
      type: [versionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
