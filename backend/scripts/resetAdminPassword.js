const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const ADMIN_EMAIL = 'admin@bizpilot.ai';

const resetAdminPassword = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  await mongoose.connect(mongoUri);

  const user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (!user) {
    console.error(`PASSWORD_RESET: ERROR - User not found: ${ADMIN_EMAIL}`);
    process.exitCode = 1;
    return;
  }

  user.password = 'password';
  await user.save();

  const verified = await user.matchPassword('password');
  if (!verified) {
    console.error('PASSWORD_RESET: ERROR - Password verification failed');
    process.exitCode = 1;
    return;
  }

  console.log('PASSWORD_RESET: SUCCESS');
};

resetAdminPassword()
  .catch(() => {
    console.error('PASSWORD_RESET: ERROR - Password reset failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
