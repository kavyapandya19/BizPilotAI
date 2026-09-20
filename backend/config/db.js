const mongoose = require('mongoose');

let dbStatus = {
  connected: false,
  host: null,
  database: 'bizpilot',
  error: null,
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bizpilot',
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizpilot';
  dbStatus.uri = uri;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    dbStatus.connected = true;
    dbStatus.host = conn.connection.host;
    dbStatus.error = null;
    console.log(`[BizPilot DB] MongoDB Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    dbStatus.connected = false;
    dbStatus.error = error.message;
    console.warn(`[BizPilot DB] Warning: Could not connect to MongoDB (${error.message}).`);
    console.warn(`[BizPilot DB] Running in offline/scaffold mode. You can connect a local MongoDB service on port 27017 or set a cloud MONGODB_URI in backend/.env`);
    return null;
  }
};

const getDbStatus = () => {
  const isMongooseReady = mongoose.connection.readyState === 1;
  return {
    ...dbStatus,
    connected: isMongooseReady,
    readyState: mongoose.connection.readyState,
  };
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDbStatus = getDbStatus;
