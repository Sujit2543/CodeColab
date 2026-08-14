const jwt = require('jsonwebtoken');
const Room = require('../models/Room');

// Map: roomId -> Map<socketId, { userId, username, color }>
const roomUsers = new Map();
// Map: roomId -> lastVersionSavedAt (timestamp)
const lastVersionTime = new Map();

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
let colorIndex = 0;
const getNextColor = () => COLORS[colorIndex++ % COLORS.length];

const MAX_VERSIONS = 20;
const VERSION_INTERVAL_MS = 30 * 1000; // 30 seconds

const registerSocketHandlers = (io) => {
  // JWT auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // ─── JOIN ROOM ───────────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId, username, password }, callback) => {
      try {
        const room = await Room.findOne({ roomId }).populate('owner', 'username');
        if (!room) return callback({ error: 'Room not found' });

        if (room.isPrivate && room.password && room.password !== password) {
          return callback({ error: 'Incorrect room password' });
        }

        socket.join(roomId);
        socket.currentRoomId = roomId;
        socket.username = username;

        if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
        const users = roomUsers.get(roomId);
        users.set(socket.id, { userId: socket.userId, username, color: getNextColor() });

        socket.to(roomId).emit('room:userJoined', {
          socketId: socket.id,
          userId: socket.userId,
          username,
        });

        const activeUsers = Array.from(users.entries()).map(([sid, u]) => ({
          socketId: sid,
          ...u,
        }));

        callback({
          success: true,
          code: room.code,
          language: room.language,
          roomName: room.name,
          users: activeUsers,
        });

        console.log(`👥 ${username} joined room ${roomId}`);
      } catch (err) {
        callback({ error: 'Failed to join room', details: err.message });
      }
    });

    // ─── CODE CHANGE ─────────────────────────────────────────────────────────
    socket.on('code:change', async ({ roomId, code, username }) => {
      socket.to(roomId).emit('code:update', { code, from: socket.id });

      try {
        const now = Date.now();
        const lastSaved = lastVersionTime.get(roomId) || 0;
        const shouldSaveVersion = now - lastSaved > VERSION_INTERVAL_MS;

        if (shouldSaveVersion) {
          lastVersionTime.set(roomId, now);
          const room = await Room.findOneAndUpdate(
            { roomId },
            {
              code,
              $push: {
                versions: {
                  $each: [{ code, language: 'javascript', savedBy: username || 'unknown', savedAt: new Date() }],
                  $slice: -MAX_VERSIONS,
                },
              },
            },
            { new: true }
          );
          // Update language in version with actual room language
          if (room) {
            const lastIdx = room.versions.length - 1;
            if (lastIdx >= 0) {
              room.versions[lastIdx].language = room.language;
              await room.save();
            }
          }
        } else {
          await Room.findOneAndUpdate({ roomId }, { code });
        }
      } catch (err) {
        console.error('DB save error:', err.message);
      }
    });

    // ─── LANGUAGE CHANGE ─────────────────────────────────────────────────────
    socket.on('language:change', async ({ roomId, language, username }) => {
      socket.to(roomId).emit('language:update', { language });
      try {
        // Save a version on language change
        const room = await Room.findOne({ roomId });
        if (room) {
          room.language = language;
          room.versions.push({ code: room.code, language, savedBy: username || 'unknown', savedAt: new Date() });
          if (room.versions.length > MAX_VERSIONS) room.versions = room.versions.slice(-MAX_VERSIONS);
          await room.save();
          lastVersionTime.set(roomId, Date.now());
        }
      } catch (err) {
        console.error('Language update error:', err.message);
      }
    });

    // ─── CURSOR POSITION ─────────────────────────────────────────────────────
    socket.on('cursor:move', ({ roomId, cursor, username }) => {
      socket.to(roomId).emit('cursor:update', {
        socketId: socket.id,
        username,
        cursor,
      });
    });

    // ─── CHAT MESSAGE ────────────────────────────────────────────────────────
    socket.on('chat:message', ({ roomId, message, username }) => {
      const payload = {
        id: Date.now().toString(),
        username,
        message,
        timestamp: new Date().toISOString(),
      };
      io.to(roomId).emit('chat:message', payload);
    });

    // ─── TYPING INDICATOR ────────────────────────────────────────────────────
    socket.on('chat:typing', ({ roomId, username }) => {
      socket.to(roomId).emit('chat:typing', { username });
    });

    // ─── LEAVE ROOM ──────────────────────────────────────────────────────────
    socket.on('room:leave', ({ roomId, username }) => {
      handleLeave(socket, io, roomId, username);
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      roomUsers.forEach((users, roomId) => {
        if (users.has(socket.id)) {
          const user = users.get(socket.id);
          users.delete(socket.id);
          io.to(roomId).emit('room:userLeft', {
            socketId: socket.id,
            userId: socket.userId,
            username: user.username,
          });
        }
      });
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

function handleLeave(socket, io, roomId, username) {
  socket.leave(roomId);
  const users = roomUsers.get(roomId);
  if (users) {
    users.delete(socket.id);
    io.to(roomId).emit('room:userLeft', {
      socketId: socket.id,
      userId: socket.userId,
      username,
    });
  }
}

module.exports = { registerSocketHandlers };
