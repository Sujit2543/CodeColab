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

// Render is behind a proxy
app.set('trust proxy', 1);

const httpServer = http.createServer(app);

// ============================================================
// DATABASE
// ============================================================

connectDB();

// ============================================================
// SECURITY
// ============================================================

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  'https://code-colab-pied.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

function isAllowedOrigin(origin) {
  // Postman / server-to-server / Render health checks
  if (!origin) {
    return true;
  }

  // Exact allowed origins
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow Vercel preview deployments
  if (
    origin.startsWith('https://') &&
    origin.endsWith('.vercel.app')
  ) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS BLOCKED:', origin);
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],

  optionsSuccessStatus: 204,
};

// IMPORTANT:
// CORS middleware must come BEFORE routes
app.use(cors(corsOptions));

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ============================================================
// RATE LIMITING
// ============================================================

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'Too many auth attempts, please try again later.',
    code: 'RATE_LIMITED',
  },
});

app.use(globalLimiter);

// ============================================================
// LOGGING
// ============================================================

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (msg) => logger.info(msg.trim()),
      },
    })
  );
}

// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/rooms', roomRoutes);

app.use('/api/projects', projectRoutes);

app.use('/api/execution', executionRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/test-cases', testCaseRoutes);

app.use('/api/analytics', analyticsRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'CodeCollab backend is running',
    time: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err);

  if (
    err.message &&
    err.message.startsWith('CORS blocked')
  ) {
    return res.status(403).json({
      success: false,
      message: err.message,
      code: 'CORS_ERROR',
    });
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'SERVER_ERROR',
  });
});

// ============================================================
// SOCKET.IO
// ============================================================

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.log('❌ SOCKET CORS BLOCKED:', origin);
        callback(new Error(`Socket CORS blocked: ${origin}`));
      }
    },

    methods: ['GET', 'POST'],

    credentials: true,
  },

  pingTimeout: 60000,
  pingInterval: 25000,
});

registerSocketHandlers(io);

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(
    `🚀 CodeCollab server running on port ${PORT}`
  );
});