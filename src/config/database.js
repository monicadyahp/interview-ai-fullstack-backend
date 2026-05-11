const mongoose = require('mongoose');
const env = require('./env');

const sanitizedUri = () => env.MONGO_URI.replace(/\/\/[^@]+@/, '//***:***@');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGO_URI);
    console.log(`[db] connected: ${sanitizedUri()}`);
  } catch (err) {
    console.error('[db] connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
