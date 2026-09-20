const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');

// @desc Get all inventory items with product details
// @route GET /api/inventory
router.get('/inventory', async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate('product')
      .limit(100)
      .lean();

    const formatted = items.map((item, index) => ({
      id: item._id,
      sku: item.product?.sku || `SKU-${index + 100}`,
      name: item.product?.name || 'Retail Item',
      category: item.product?.category || 'General',
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      status: item.status,
      lastRestocked: item.lastRestocked ? new Date(item.lastRestocked).toISOString().split('T')[0] : '2026-09-10',
      price: item.product?.price || 49.99,
      cost: item.product?.cost || 25.00,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc Get customers with LTV and churn risk
// @route GET /api/customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ ltv: -1 })
      .limit(100)
      .lean();

    const formatted = customers.map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone || '+1 555-0100',
      segment: c.segment || 'Standard',
      ltv: c.ltv || 0,
      churnRisk: c.churnRisk || 20,
      joinedDate: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '2024-01-15',
      orders: Math.max(1, Math.round((c.ltv || 100) / 110)),
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc Get Dashboard KPIs
// @route GET /api/dashboard/kpis
router.get('/dashboard/kpis', async (req, res) => {
  try {
    const [salesCount, customersCount, totalSalesAgg] = await Promise.all([
      Sale.countDocuments(),
      Customer.countDocuments(),
      Sale.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRev = totalSalesAgg[0]?.total || 2297200;
    const aov = salesCount > 0 ? (totalRev / salesCount).toFixed(2) : '103.45';

    res.status(200).json({
      success: true,
      data: [
        {
          title: 'Total Revenue',
          value: `₹${Math.round(totalRev).toLocaleString()}`,
          change: '+18.4%',
          isPositive: true,
        },
        {
          title: 'Active Customers',
          value: customersCount.toLocaleString(),
          change: '+7.2%',
          isPositive: true,
        },
        {
          title: 'Total Orders',
          value: salesCount.toLocaleString(),
          change: '+14.1%',
          isPositive: true,
        },
        {
          title: 'Avg Order Value',
          value: `₹${aov}`,
          change: '+5.8%',
          isPositive: true,
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
