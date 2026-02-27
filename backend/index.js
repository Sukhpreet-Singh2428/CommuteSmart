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

// //? Initialize Socket.io
// const io = socketIo(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         credentials: true
//     }
// });

// //? Middleware
// app.use(cors({ origin: "http://localhost:3000", credentials: true}));
// app.use(express.json());
// app.use(cookieParser());

// app.set('io', io);    //? io available glovally in controllers

// //? Routes
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);

// const locationRoutes = require('./routes/location');
// app.use('/api/location', locationRoutes);


// app.get('/', (req, res) => {
//     res.json({message: "CommuteSmart Backend is Running !"});
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`server running on http://localhost:${PORT}`);
// });

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
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://commute-smart.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.set('io', io);

//? Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const locationRoutes = require('./routes/location');
app.use('/api/location', locationRoutes);

app.get('/', (req, res) => {
  res.json({ message: "CommuteSmart Backend is Running!" });
});

// 🔥 IMPORTANT CHANGE HERE
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});