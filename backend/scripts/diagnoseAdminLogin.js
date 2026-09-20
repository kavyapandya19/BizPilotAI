const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const ADMIN_EMAIL = 'admin@bizpilot.ai';

const getConnectionTarget = (uri) => {
  try {
    const parsed = new URL(uri);
    return {
      host: parsed.hostname || '(unknown)',
      database: parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\//, '')) || '(default)' : '(default)',
    };
  } catch {
    return { host: '(unable to parse)', database: '(unable to parse)' };
  }
};

const sanitizeError = (message, uri) => {
  let sanitized = String(message || 'Unknown error');
  if (uri) sanitized = sanitized.split(uri).join('[REDACTED_MONGODB_URI]');
  return sanitized.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, '$1[REDACTED]');
};

const diagnose = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  const target = getConnectionTarget(mongoUri);
  console.log('ADMIN LOGIN DIAGNOSTIC');
  console.log(`MONGODB_HOST: ${target.host}`);
  console.log(`MONGODB_DATABASE: ${target.database}`);
  console.log(`CHECKING_EMAIL: ${ADMIN_EMAIL}`);

  await mongoose.connect(mongoUri);
  console.log('MONGODB_CONNECTION: SUCCESS');

  const user = await User.findOne({ email: ADMIN_EMAIL })
    .select('+password');

  console.log(`USER_EXISTS: ${user ? 'YES' : 'NO'}`);

  if (!user) {
    console.log('USER_ID: null');
    console.log('USER_EMAIL: null');
    console.log('USER_ROLE: null');
    console.log('BUSINESS_ID: null');
    console.log('PASSWORD_HASH_EXISTS: NO');
    console.log('PASSWORD_HASH_LENGTH: 0');
    console.log('PASSWORD_TEST: NO MATCH');
    console.log('MODEL_METHOD_TEST: NO MATCH');
    return;
  }

  const hasPasswordHash = typeof user.password === 'string' && user.password.length > 0;
  console.log(`USER_ID: ${user._id}`);
  console.log(`USER_EMAIL: ${user.email}`);
  console.log(`USER_ROLE: ${user.role}`);
  console.log(`BUSINESS_ID: ${user.business ? user.business.toString() : 'null'}`);
  console.log(`PASSWORD_HASH_EXISTS: ${hasPasswordHash ? 'YES' : 'NO'}`);
  console.log(`PASSWORD_HASH_LENGTH: ${hasPasswordHash ? user.password.length : 0}`);

  const passwordMatches = hasPasswordHash && await bcrypt.compare('password', user.password);
  console.log(`PASSWORD_TEST: ${passwordMatches ? 'MATCH' : 'NO MATCH'}`);

  const modelMethodMatches = hasPasswordHash && await user.matchPassword('password');
  console.log(`MODEL_METHOD_TEST: ${modelMethodMatches ? 'MATCH' : 'NO MATCH'}`);
};

diagnose()
  .catch((error) => {
    console.error(`DIAGNOSTIC_ERROR: ${sanitizeError(error.message, process.env.MONGODB_URI)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MONGODB_CONNECTION: CLOSED');
    }
  });
