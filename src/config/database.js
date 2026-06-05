const mongoose = require("mongoose");
// const dns = require("dns");

// Force Google Public DNS to resolve MongoDB Atlas SRV records
// Fixes: queryTxt ETIMEOUT cluster0.xxx.mongodb.net
// dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
};

module.exports = connectDB;
