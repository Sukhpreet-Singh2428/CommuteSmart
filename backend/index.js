require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');

const connectDB = require('./config/db');

connectDB();

const app = express();
const server = http.createServer(app);

// ─── CORS — must be the FIRST middleware ────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://commute-smart.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,           // ← REQUIRED for cross-site cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options(/(.*)/, cors());      // ← keep preflight handler
// ────────────────────────────────────────────────────────────────────────────

//? Other Middleware
app.use(express.json());
app.use(cookieParser());

// Passport initialization for OAuth
const passport = require('./config/passport');
app.use(passport.initialize());

//? Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.set('io', io);

// ─── Debug endpoint — remove after confirming CORS works ────────────────────
app.get('/api/cors-test', (req, res) => {
  res.json({ corsOrigins: allowedOrigins, message: 'CORS config loaded' });
});
// ────────────────────────────────────────────────────────────────────────────

//? Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const locationRoutes = require('./routes/location');
app.use('/api/location', locationRoutes);

const alertRoutes = require('./routes/alerts');
app.use('/api/alerts', alertRoutes);

const routeRoutes = require('./routes/routes');
app.use('/api/routes', routeRoutes);

const leaderboardRoutes = require('./routes/leaderboard');
app.use('/api/leaderboard', leaderboardRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const tripRoutes = require('./routes/trips');
app.use('/api/trips', tripRoutes);

const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  res.json({ message: "CommuteSmart Backend is Running!" });
});

//? Socket.io connection handler
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Personal room for user-specific events (badges, points)
  socket.on('join:personal', ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined personal room`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', socket.id, reason);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Allowed CORS origins:', allowedOrigins);
});