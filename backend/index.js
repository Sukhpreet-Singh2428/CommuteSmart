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

//? Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://commute-smart.vercel.app"
    ],
    credentials: true
  }
});

//? Middleware
app.use(express.json());

app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PREVIEW,
].filter(Boolean);

if (allowedOrigins.length === 2) {
  // Fallback if env vars not set
  allowedOrigins.push('https://commute-smart.vercel.app');
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: origin not allowed: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

app.set('io', io);

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
});