const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const { getDbStatus, connectDB } = require('./config/db');

// Health and DB status routes
app.get('/api/health', (req, res) => {
  const db = getDbStatus();
  res.status(200).json({
    status: 'success',
    message: 'BizPilot API is running',
    timestamp: new Date().toISOString(),
    database: {
      type: 'MongoDB',
      connected: db.connected,
      status: db.connected ? 'connected' : 'disconnected',
      host: db.host,
      uri: db.uri ? db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@') : null, // sanitize credentials
      error: db.error,
    },
  });
});

app.get('/api/db-status', (req, res) => {
  const db = getDbStatus();
  res.status(200).json({
    success: true,
    data: {
      type: 'MongoDB',
      connected: db.connected,
      status: db.connected ? 'connected' : 'disconnected',
      host: db.host,
      uri: db.uri ? db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@') : null,
      error: db.error,
    },
  });
});

app.post('/api/db-reconnect', async (req, res) => {
  await connectDB();
  const db = getDbStatus();
  res.status(200).json({
    success: true,
    data: {
      type: 'MongoDB',
      connected: db.connected,
      status: db.connected ? 'connected' : 'disconnected',
      host: db.host,
      error: db.error,
    },
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', dataRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

module.exports = app;
