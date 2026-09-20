const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Business = require('../models/Business');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizpilot';
const CSV_FILE = path.join(__dirname, '../data/superstore.csv');

const importData = async () => {
  try {
    const sanitizedUri = DB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`[Importer] Connecting to MongoDB Atlas: ${sanitizedUri}`);

    await mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('[Importer] Connected to MongoDB Atlas successfully!');

    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found at: ${CSV_FILE}`);
    }

    console.log('[Importer] Parsing Kaggle Superstore dataset...');

    const productsMap = new Map();
    const customersMap = new Map();
    const rawSales = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (row) => {
          const pId = row['Product ID'];
          const pName = row['Product Name'];
          const cId = row['Customer ID'];
          const cName = row['Customer Name'];

          if (!pId || !pName || !cId || !cName) return;

          const sales = parseFloat(row['Sales']) || 0;
          const qty = parseInt(row['Quantity']) || 1;
          const profit = parseFloat(row['Profit']) || 0;
          const dateStr = row['Order Date']; // e.g. 11/8/2017

          // 1. Collect Products
          if (!productsMap.has(pId)) {
            const unitPrice = Math.max(1, +(sales / qty).toFixed(2));
            const unitProfit = +(profit / qty).toFixed(2);
            const cost = Math.max(0.5, +(unitPrice - unitProfit).toFixed(2));
            productsMap.set(pId, {
              sku: pId,
              name: pName.trim(),
              category: (row['Category'] || 'General').trim() + ' - ' + (row['Sub-Category'] || 'Standard').trim(),
              price: unitPrice,
              cost: cost,
            });
          }

          // 2. Collect Customers
          if (!customersMap.has(cId)) {
            const cleanName = cName.trim();
            const emailPrefix = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
            const cleanEmail = `${emailPrefix}@superstore.com`;
            customersMap.set(cId, {
              originalId: cId,
              name: cleanName,
              email: cleanEmail,
              segment: row['Segment'] || 'Standard',
              phone: '+1 555-' + Math.floor(1000 + Math.random() * 9000),
              totalSales: 0,
              orderCount: 0,
              lastDate: null,
            });
          }

          const c = customersMap.get(cId);
          c.totalSales += sales;
          c.orderCount += 1;

          let parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) parsedDate = new Date();
          if (!c.lastDate || parsedDate > c.lastDate) {
            c.lastDate = parsedDate;
          }

          // 3. Raw Sale records
          rawSales.push({
            pId,
            cId,
            quantity: qty,
            totalAmount: sales,
            date: parsedDate,
            channel: row['Ship Mode'] === 'Same Day' ? 'In-Store' : row['Segment'] === 'Corporate' ? 'B2B' : 'Online',
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`[Importer] Extracted ${productsMap.size} unique products and ${customersMap.size} unique customers from ${rawSales.length} orders.`);

    // Clear old data
    console.log('[Importer] Clearing existing collections...');
    await Business.deleteMany();
    await User.deleteMany();
    await Product.deleteMany();
    await Customer.deleteMany();
    await Inventory.deleteMany();
    await Sale.deleteMany();

    // 1. Create Business
    const business = await Business.create({
      name: 'Global Superstore Enterprise',
      industry: 'Retail & E-Commerce',
    });
    console.log(`[Importer] Created Business: ${business.name}`);

    // 2. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);
    await User.create({
      name: 'Admin User',
      email: 'admin@bizpilot.ai',
      password: hashedPassword,
      role: 'admin',
      business: business._id,
    });
    console.log('[Importer] Created Admin User: admin@bizpilot.ai');

    // 3. Insert Products in Batches
    console.log('[Importer] Inserting Products...');
    const productDocs = Array.from(productsMap.values()).map((p) => ({
      ...p,
      business: business._id,
    }));
    const insertedProducts = await Product.insertMany(productDocs);
    console.log(`[Importer] Inserted ${insertedProducts.length} Products!`);

    // Map SKU -> Product ID
    const productSkuToId = new Map();
    insertedProducts.forEach((p) => productSkuToId.set(p.sku, p._id));

    // 4. Insert Customers
    console.log('[Importer] Calculating Churn Risk & Inserting Customers...');
    const customerDocs = Array.from(customersMap.values()).map((c) => {
      // Calculate realistic churn risk based on orders & recency
      let riskScore = Math.floor(15 + Math.random() * 25); // base 15-40%
      if (c.orderCount <= 2) riskScore += 35; // higher churn risk for few orders
      if (c.totalSales < 200) riskScore += 15;
      if (c.totalSales > 2500) riskScore = Math.max(5, riskScore - 25); // loyal high LTV
      riskScore = Math.min(95, Math.max(4, riskScore));

      return {
        business: business._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        segment: c.segment === 'Corporate' ? 'Enterprise' : c.segment === 'Home Office' ? 'Premium' : 'Standard',
        ltv: +c.totalSales.toFixed(2),
        churnRisk: riskScore,
      };
    });

    const insertedCustomers = await Customer.insertMany(customerDocs);
    console.log(`[Importer] Inserted ${insertedCustomers.length} Customers!`);

    const customerNameToId = new Map();
    insertedCustomers.forEach((c) => customerNameToId.set(c.name, c._id));

    // 5. Insert Inventory Records for each product
    console.log('[Importer] Generating & Inserting Inventory records...');
    const inventoryDocs = insertedProducts.map((p, index) => {
      // Realistic distribution:
      // ~3% Out of Stock (0 units)
      // ~8% Low Stock (1 - 12 units)
      // ~89% In Stock (15 - 280 units)
      let stock = 0;
      const rand = Math.random();
      if (rand < 0.03) {
        stock = 0;
      } else if (rand < 0.11) {
        stock = Math.floor(1 + Math.random() * 12);
      } else {
        stock = Math.floor(20 + Math.random() * 250);
      }

      let status = 'In Stock';
      if (stock === 0) status = 'Out of Stock';
      else if (stock <= 15) status = 'Low Stock';

      return {
        business: business._id,
        product: p._id,
        currentStock: stock,
        reorderLevel: 15,
        status,
        lastRestocked: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
      };
    });

    await Inventory.insertMany(inventoryDocs);
    console.log(`[Importer] Inserted ${inventoryDocs.length} Inventory items!`);

    // 6. Insert Sales (Batch of 3,000 recent transactions)
    console.log('[Importer] Inserting Sales transactions...');
    const salesDocs = [];
    for (let i = 0; i < rawSales.length; i++) {
      const s = rawSales[i];
      const prodId = productSkuToId.get(s.pId);
      const custObj = customersMap.get(s.cId);
      const custId = custObj ? customerNameToId.get(custObj.name) : null;

      if (prodId) {
        salesDocs.push({
          business: business._id,
          product: prodId,
          customer: custId,
          quantity: s.quantity,
          totalAmount: s.totalAmount,
          date: s.date,
          channel: s.channel,
        });
      }
    }

    // Insert in chunks of 1000
    const chunkSize = 1000;
    for (let i = 0; i < salesDocs.length; i += chunkSize) {
      await Sale.insertMany(salesDocs.slice(i, i + chunkSize));
    }
    console.log(`[Importer] Inserted ${salesDocs.length} Sales transactions!`);

    console.log('\n======================================================');
    console.log('🎉 KAGGLE SUPERSTORE DATASET SUCCESSFULLY IMPORTED! 🎉');
    console.log(`• Products:     ${insertedProducts.length}`);
    console.log(`• Customers:    ${insertedCustomers.length}`);
    console.log(`• Inventory:    ${inventoryDocs.length}`);
    console.log(`• Sales Orders: ${salesDocs.length}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
};

importData();
