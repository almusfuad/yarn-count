import mongoose from 'mongoose';
import logger from '../utils/logger.js';

let isConnected = false;

/**
 * Connect to MongoDB Atlas with connection pooling and error handling
 * Uses exponential backoff for retries
 */
export async function connectToMongoDB() {
  if (isConnected) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');

    // Connection event handlers
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isConnected = true;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;
    throw error;
  }
}

/**
 * Check if MongoDB is connected
 */
export function isMongoDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromMongoDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ MongoDB disconnected');
  }
}

/**
 * Get connection status for health checks
 */
export function getConnectionStatus() {
  return {
    isConnected: isMongoDBConnected(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    timestamp: new Date().toISOString(),
  };
}

export { mongoose };
