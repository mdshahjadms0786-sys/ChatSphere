const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI environment variable is not set. Set it in Render dashboard.');
    process.exit(1);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB Connected');
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed: ${error.message}`);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }
  process.exit(1);
};

module.exports = connectDB;