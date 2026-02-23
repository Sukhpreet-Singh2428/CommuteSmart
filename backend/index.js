const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

//? Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true}));
app.use(express.json());
app.use(cookieParser());

//? Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({message: "CommuteSmart Backend is Running !"});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});
