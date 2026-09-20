const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.ObjectId,
    ref: 'Business',
    required: true
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer'
  },
  quantity: {
    type: Number,
    required: [true, 'Please add a quantity'],
    min: 1
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please add the total sale amount']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  channel: {
    type: String,
    enum: ['Online', 'In-Store', 'B2B', 'Other'],
    default: 'Online'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
