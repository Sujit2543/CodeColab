require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { registerSocketHandlers } = require('./sockets');

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const projectRoutes = require('./routes/projects');
const executionRoutes = require('./routes/execution');
const notificationRoutes = require('./routes/notifications');
const testCaseRoutes = require('./routes/testCases');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// IMPORTANT: Render is behind a proxy
app.set('trust proxy', 1);

const httpServer = http.createServer(app);

// Connect DB
connectDB();

// ── Security Middleware ───────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
  'https://code-colab-pied.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED'
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.',
    code: 'RATE_LIMITED'
  },
});

app.use(globalLimiter);

app.use(express.json({
  limit: '2mb'
}));

app.use(express.urlencoded({
  extended: true
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (msg) => logger.info(msg.trim())
    },
  }));
}

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── 404 ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

// ── Socket.io ───────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://code-colab-pied.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

registerSocketHandlers(io);

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});