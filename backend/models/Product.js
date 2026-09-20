const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.ObjectId,
    ref: 'Business',
    required: true
  },
  sku: {
    type: String,
    required: [true, 'Please add an SKU'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a selling price']
  },
  cost: {
    type: Number,
    required: [true, 'Please add a cost price']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
