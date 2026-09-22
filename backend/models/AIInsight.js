const mongoose = require('mongoose');

const AIInsightSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20000,
  },
  source: {
    type: String,
    enum: ['gemini', 'fallback'],
    default: 'gemini',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('AIInsight', AIInsightSchema);
