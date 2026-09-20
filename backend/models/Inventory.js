const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.ObjectId,
    ref: 'Business',
    required: true
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
    unique: true // One inventory record per product
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 10
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  lastRestocked: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update status based on stock before saving
InventorySchema.pre('save', function(next) {
  if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
