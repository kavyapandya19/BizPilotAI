import api from './api';

export const customerService = {
  getCustomers: async ({ ml = false } = {}) => {
    const response = await api.get('/customers', { params: ml ? { ml: 'true' } : {} });
    return response.data;
  },

  getChurnModelInfo: async () => {
    const response = await api.get('/customers/churn-model');
    return response.data.data;
  },

  sendRetentionEmail: async (id, payload) => {
    const response = await api.post(`/customers/${id}/retention-email`, payload);
    return response.data;
  },

  launchBatchRetentionCampaign: async (threshold = 70) => {
    const response = await api.request({
      method: 'post',
      url: '/customers/campaign/batch-retention-emails',
      params: { threshold },
    });
    return response.data;
  },
};
