const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/rooms - Create a room
router.post('/', protect, async (req, res) => {
  try {
    const { name, language, isPrivate, password } = req.body;

    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const room = await Room.create({
      roomId: uuidv4(),
      name,
      owner: req.user._id,
      language: language || 'javascript',
      isPrivate: !!isPrivate,
      password: isPrivate ? password || '' : '',
    });

    await room.populate('owner', 'username email avatar');
    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms - List public rooms
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms/:roomId/versions - Get version history
router.get('/:roomId/versions', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }, 'versions name');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ versions: room.versions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/:roomId/restore - Restore a version
router.post('/:roomId/restore', protect, async (req, res) => {
  try {
    const { versionIndex } = req.body;
    if (versionIndex === undefined || versionIndex === null) {
      return res.status(400).json({ message: 'versionIndex is required' });
    }

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const idx = Number(versionIndex);
    if (isNaN(idx) || idx < 0 || idx >= room.versions.length) {
      return res.status(400).json({ message: 'Invalid version index' });
    }

    const version = room.versions[idx];
    room.code = version.code;
    room.language = version.language;
    await room.save();

    res.json({ code: room.code, language: room.language });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms/:roomId - Get room by ID
router.get('/:roomId', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate(
      'owner',
      'username avatar'
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Private room check — password verified on socket join
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms/:roomId/versions - Get version history
router.get('/:roomId/versions', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ versions: room.versions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/:roomId/restore - Restore a version
router.post('/:roomId/restore', protect, async (req, res) => {
  try {
    const { versionIndex } = req.body;
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const version = room.versions[versionIndex];
    if (!version) return res.status(400).json({ message: 'Version not found' });
    room.code = version.code;
    room.language = version.language;
    await room.save();
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/rooms/:roomId - Delete room (owner only)
router.delete('/:roomId', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this room' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
