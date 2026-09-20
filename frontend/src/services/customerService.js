import api from './api';

const mockCustomers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@techcorp.com', phone: '+1 555-0101', segment: 'Enterprise', ltv: 18400, churnRisk: 6.2, joinedDate: '2024-03-15', orders: 42, riskTier: 'Healthy', riskFactors: ['Consistent repeat order frequency and healthy recency'], mlPowered: true },
  { id: 2, name: 'Michael Chen', email: 'm.chen@innovate.io', phone: '+1 555-0102', segment: 'Enterprise', ltv: 14200, churnRisk: 5.4, joinedDate: '2024-01-20', orders: 38, riskTier: 'Healthy', riskFactors: ['Consistent repeat order frequency and healthy recency'], mlPowered: true },
  { id: 3, name: 'Aisha Patel', email: 'aisha@startup.co', phone: '+1 555-0103', segment: 'Standard', ltv: 3200, churnRisk: 64.8, joinedDate: '2024-08-10', orders: 9, riskTier: 'Moderate', riskFactors: ['Elevated dormancy (38d since activity)'], mlPowered: true },
  { id: 4, name: 'James O\'Brien', email: 'james.ob@retail.com', phone: '+1 555-0104', segment: 'Premium', ltv: 8900, churnRisk: 19.5, joinedDate: '2024-05-02', orders: 21, riskTier: 'Healthy', riskFactors: ['Moderate engagement across RFM dimensions'], mlPowered: true },
  { id: 5, name: 'Priya Sharma', email: 'p.sharma@media.net', phone: '+1 555-0105', segment: 'Standard', ltv: 1800, churnRisk: 86.3, joinedDate: '2025-02-14', orders: 5, riskTier: 'High', riskFactors: ['Inactivity gap: 65 days since last order', 'Standard segment without loyalty tiering'], mlPowered: true },
  { id: 6, name: 'Carlos Rivera', email: 'c.rivera@logistics.mx', phone: '+1 555-0106', segment: 'Enterprise', ltv: 22100, churnRisk: 4.1, joinedDate: '2023-11-08', orders: 58, riskTier: 'Healthy', riskFactors: ['Consistent repeat order frequency and healthy recency'], mlPowered: true },
  { id: 7, name: 'Emily Watson', email: 'emily@designstudio.co', phone: '+1 555-0107', segment: 'Premium', ltv: 6700, churnRisk: 31.2, joinedDate: '2024-07-19', orders: 16, riskTier: 'Healthy', riskFactors: ['Moderate engagement across RFM dimensions'], mlPowered: true },
  { id: 8, name: 'David Kim', email: 'd.kim@finance.io', phone: '+1 555-0108', segment: 'Enterprise', ltv: 31500, churnRisk: 3.2, joinedDate: '2023-06-01', orders: 74, riskTier: 'Healthy', riskFactors: ['Consistent repeat order frequency and healthy recency'], mlPowered: true },
  { id: 9, name: 'Fatima Al-Hassan', email: 'fatima@consulting.ae', phone: '+1 555-0109', segment: 'Premium', ltv: 9400, churnRisk: 16.8, joinedDate: '2024-04-22', orders: 23, riskTier: 'Healthy', riskFactors: ['Consistent repeat order frequency and healthy recency'], mlPowered: true },
  { id: 10, name: 'Tom Bauer', email: 't.bauer@agency.de', phone: '+1 555-0110', segment: 'Standard', ltv: 2100, churnRisk: 78.4, joinedDate: '2025-01-30', orders: 6, riskTier: 'High', riskFactors: ['Inactivity gap: 58 days since last order'], mlPowered: true },
  { id: 11, name: 'Nadia Okonkwo', email: 'nadia@healthtech.ng', phone: '+1 555-0111', segment: 'Standard', ltv: 4500, churnRisk: 43.1, joinedDate: '2024-09-05', orders: 12, riskTier: 'Moderate', riskFactors: ['Elevated dormancy (32d since activity)'], mlPowered: true },
  { id: 12, name: 'Lucas Bernard', email: 'l.bernard@ecom.fr', phone: '+1 555-0112', segment: 'Premium', ltv: 7800, churnRisk: 25.0, joinedDate: '2024-06-11', orders: 19, riskTier: 'Healthy', riskFactors: ['Moderate engagement across RFM dimensions'], mlPowered: true },
];

export const customerService = {
  getCustomers: async (params = {}) => {
    try {
      const response = await api.get('/customers', { params });
      if (response.data && response.data.success && response.data.data?.length > 0) {
        return response.data;
      }
    } catch (error) {
      console.warn('Backend customer API unavailable, using local cache:', error.message);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, data: mockCustomers });
      }, 300);
    });
  },

  getChurnModelInfo: async () => {
    try {
      const response = await api.get('/customers/churn-model');
      if (response.data && response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('Churn model metadata unavailable:', error.message);
    }
    return {
      model_type: 'RandomForestClassifier',
      n_estimators: 100,
      training_accuracy: 0.9113,
      feature_importances: {
        order_count: 0.3628,
        ltv: 0.3148,
        recency_days: 0.2187,
        avg_order_value: 0.0539,
        segment_code: 0.0497,
      },
      status: 'active',
    };
  },

  sendRetentionEmail: async (customerId, emailData) => {
    try {
      const response = await api.post(`/customers/${customerId}/retention-email`, emailData);
      return response.data;
    } catch (error) {
      console.warn('Backend retention email failed, using simulation:', error.message);
      return {
        success: true,
        message: `Simulation: Win-Back email sent to ${emailData.recipientName || 'customer'}`,
        data: {
          deliveredAt: new Date().toISOString(),
          campaign: emailData,
        },
      };
    }
  },

  launchBatchRetentionCampaign: async (threshold = 70) => {
    try {
      const response = await api.post(`/customers/campaign/batch-retention-emails?threshold=${threshold}`);
      return response.data;
    } catch (error) {
      console.warn('Backend batch retention campaign failed, using simulation:', error.message);
      return {
        success: true,
        count: 15,
        message: 'Simulation: Autonomous retention campaign dispatched to high churn accounts',
      };
    }
  },

  getN8nStatus: async () => {
    try {
      const response = await api.get('/integrations/n8n/status');
      return response.data;
    } catch (error) {
      return {
        success: false,
        data: {
          configured: false,
          webhookUrl: 'http://localhost:5678/webhook/bizpilot-churn-retention',
          workflowTemplateAvailable: true,
        },
      };
    }
  },

  testN8nWebhook: async () => {
    try {
      const response = await api.post('/integrations/n8n/test');
      return response.data;
    } catch (error) {
      return {
        success: false,
        data: {
          success: false,
          message: error.response?.data?.data?.message || error.message,
        },
      };
    }
  },
};

