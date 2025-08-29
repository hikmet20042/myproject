
import mongoose from 'mongoose';


let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Priority: MongoDB > Oracle Autonomous JSON Database (temporarily)
  const MONGODB_URI = process.env.MONGODB_URI as string;
  const ORACLE_MONGODB_URI = process.env.ORACLE_MONGODB_URI as string;
  
  const connectionUri = MONGODB_URI || ORACLE_MONGODB_URI;
  const dbType = MONGODB_URI ? 'MongoDB' : 'Oracle Autonomous JSON Database';
  
  if (!connectionUri) {
    throw new Error('Please define either ORACLE_MONGODB_URI or MONGODB_URI environment variable.');
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    };
    
    cached.promise = mongoose.connect(connectionUri, opts).then((mongoose) => {
      console.log(`✅ Connected to ${dbType}`);
      console.log(`🔗 Using connection: ${connectionUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      return mongoose;
    }).catch((error) => {
      console.error(`❌ ${dbType} connection error:`, error);
      throw error;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
