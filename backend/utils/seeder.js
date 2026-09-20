const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Business = require('../models/Business');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizpilot';

const seedData = async () => {
  try {
    const sanitizedUri = DB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`[Seeder] Connecting to database: ${sanitizedUri}...`);
    
    await mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('[Seeder] Connected to database successfully!');

    // Clear existing
    await Business.deleteMany();
    await User.deleteMany();
    await Product.deleteMany();
    await Customer.deleteMany();
    await Inventory.deleteMany();

    console.log('[Seeder] Cleared existing collections.');

    // 1. Create Business
    const business = await Business.create({
      name: 'Acme Electronics',
      industry: 'Retail',
    });
    console.log('[Seeder] Created Business: Acme Electronics');

    // 2. Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    await User.create({
      name: 'Admin User',
      email: 'admin@bizpilot.ai',
      password: hashedPassword,
      role: 'admin',
      business: business._id,
    });
    console.log('[Seeder] Created Admin User: admin@bizpilot.ai (password: password)');

    // 3. Create Products
    const p1 = await Product.create({
      business: business._id,
      sku: 'SKU-001',
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: 199.99,
      cost: 80.00,
    });

    const p2 = await Product.create({
      business: business._id,
      sku: 'SKU-002',
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      price: 149.99,
      cost: 60.00,
    });
    console.log('[Seeder] Created Products: SKU-001, SKU-002');

    // 4. Create Customers
    await Customer.create([
      { business: business._id, name: 'John Doe', email: 'john@example.com', segment: 'VIP', ltv: 1200 },
      { business: business._id, name: 'Jane Smith', email: 'jane@example.com', segment: 'Standard', ltv: 150 },
    ]);
    console.log('[Seeder] Created Customers: John Doe, Jane Smith');

    // 5. Create Inventory
    await Inventory.create([
      { business: business._id, product: p1._id, currentStock: 45, reorderLevel: 20 },
      { business: business._id, product: p2._id, currentStock: 5, reorderLevel: 15 },
    ]);
    console.log('[Seeder] Created Inventory records');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
    process.exit(1);
  }
};

seedData();
