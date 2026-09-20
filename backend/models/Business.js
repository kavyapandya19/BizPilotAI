const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a business name'],
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters']
  },
  industry: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
});

module.exports = mongoose.model('Business', BusinessSchema);
