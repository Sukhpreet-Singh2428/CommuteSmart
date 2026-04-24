const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');

const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ─── CORS — must be the FIRST middleware ────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://commute-smart.vercel.app',
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PREVIEW,
].filter(Boolean);

// Deduplicate (in case CLIENT_URL is the same as the hardcoded Vercel URL)
const uniqueOrigins = [...new Set(ALLOWED_ORIGINS)];

const corsOptions = {
  origin: function (origin, callback) {
    // No origin = server-to-server, Postman, mobile — allow
    if (!origin) return callback(null, true);
    if (uniqueOrigins.includes(origin)) return callback(null, true);
    console.error('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200, // Some browsers (IE11) choke on 204
};

app.use(cors(corsOptions));


// Belt-and-suspenders: manually set CORS headers on every response
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (uniqueOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Respond to preflight immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
// ────────────────────────────────────────────────────────────────────────────

//? Other Middleware
app.use(express.json());
app.use(cookieParser());

//? Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: uniqueOrigins,
    credentials: true
  }
});

app.set('io', io);

// ─── Debug endpoint — remove after confirming CORS works ────────────────────
app.get('/api/cors-test', (req, res) => {
  res.json({ corsOrigins: uniqueOrigins, message: 'CORS config loaded' });
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
  console.log('Allowed CORS origins:', uniqueOrigins);
});