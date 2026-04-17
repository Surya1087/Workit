const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * Uses MONGODB_URI from environment variables
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    console.log('DEBUG: Attempting to connect to MongoDB...');
    console.log('DEBUG: MONGODB_URI:', mongoUri ? '✓ Set' : '✗ NOT SET');
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('DEBUG: Connection string starts with:', mongoUri.substring(0, 30) + '...');

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };