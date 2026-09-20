const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Service to communicate with BizPilot Python ML Service (FastAPI)
 */
class MLService {
  constructor() {
    this.client = axios.create({
      baseURL: ML_SERVICE_URL,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch RandomForest Churn Model Metadata
   */
  async getChurnModelInfo() {
    try {
      const res = await this.client.get('/api/v1/predict/churn/model-info');
      if (res.data && res.data.success) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.warn('[MLService] Could not reach ML model-info:', err.message);
      return null;
    }
  }

  /**
   * Predict churn for a single customer
   */
  async predictSingleChurn(customerData) {
    try {
      const res = await this.client.post('/api/v1/predict/churn', customerData);
      if (res.data && res.data.success) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.warn(`[MLService] Churn prediction failed for customer ${customerData.name}:`, err.message);
      return null;
    }
  }

  /**
   * Predict churn for a batch of customers
   */
  async predictBatchChurn(customers) {
    try {
      const payload = {
        customers: customers.map((c) => ({
          id: c.id || c._id,
          name: c.name,
          email: c.email,
          orders: c.orders || c.orderCount || Math.max(1, Math.round((c.ltv || 100) / 120)),
          ltv: c.ltv || 0,
          avg_order_value: c.orders ? (c.ltv / c.orders) : 60,
          recency_days: c.recency_days || Math.min(120, Math.max(5, Math.round(90 - (c.orders || 1) * 3))),
          segment: c.segment || 'Standard',
        })),
      };

      const res = await this.client.post('/api/v1/predict/churn/batch', payload);
      if (res.data && res.data.success) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.warn('[MLService] Batch churn prediction failed:', err.message);
      return null;
    }
  }
}

module.exports = new MLService();
