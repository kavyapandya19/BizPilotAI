const mongoose = require('mongoose');

const AgentActionSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.ObjectId,
    ref: 'Business',
    required: true
  },
  trigger: {
    type: String,
    enum: ['Scheduled', 'Manual', 'Event', 'System'],
    default: 'System'
  },
  goal: {
    type: String,
    required: true
  },
  plan: [{
    stepNumber: Number,
    description: String,
    toolToUse: String
  }],
  executionLog: [{
    stepNumber: Number,
    toolUsed: String,
    result: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['Success', 'Failed', 'Pending Approval'],
      default: 'Success'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  overallStatus: {
    type: String,
    enum: ['In Progress', 'Completed', 'Failed', 'Awaiting Approval'],
    default: 'In Progress'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

module.exports = mongoose.model('AgentAction', AgentActionSchema);
