require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

async function syncChurn() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Sync] Connected to MongoDB Atlas');

  const customers = await mongoose.connection.collection('customers').find().toArray();
  console.log(`[Sync] Found ${customers.length} customers`);

  const payload = {
    customers: customers.map((c) => {
      const orders = Math.max(1, Math.round((c.ltv || 100) / 110));
      const baseRisk = c.churnRisk || 20;
      const recency_days = baseRisk >= 60
        ? Math.min(120, Math.round(50 + (baseRisk - 60) * 1.5))
        : Math.max(4, Math.round(45 - Math.min(orders, 25) * 1.5));
      return {
        id: c._id.toString(),
        name: c.name,
        orders,
        ltv: c.ltv || 0,
        avg_order_value: orders ? c.ltv / orders : 60,
        recency_days,
        segment: c.segment || 'Standard',
      };
    }),
  };

  const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  console.log(`[Sync] Calling RandomForest batch inference at ${ML_URL}...`);
  const res = await axios.post(`${ML_URL}/api/v1/predict/churn/batch`, payload);

  const predictions = res.data.data;
  console.log(`[Sync] Scored ${predictions.length} customers with RandomForest`);

  const bulkOps = predictions.map((item) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(item.id) },
      update: {
        $set: {
          churnRisk: item.churn_risk_percent,
        },
      },
    },
  }));

  const bulkRes = await mongoose.connection.collection('customers').bulkWrite(bulkOps);
  console.log(`[Sync] Successfully updated ${bulkRes.modifiedCount} customers in MongoDB!`);
  process.exit(0);
}

syncChurn().catch((err) => {
  console.error('[Sync Error]', err);
  process.exit(1);
});
