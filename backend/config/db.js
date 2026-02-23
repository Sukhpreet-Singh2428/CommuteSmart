const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully");
    } catch(error){
        console.log("MongoDB connection failed : ", error);
        process.exit(1);
    }
};

module.exports = connectDB;