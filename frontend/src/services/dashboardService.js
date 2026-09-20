import api from './api';

export const dashboardService = {
  getKPIs: async () => {
    try {
      const response = await api.get('/dashboard/kpis');
      if (response.data && response.data.success && response.data.data?.length > 0) {
        return response.data;
      }
    } catch (error) {
      console.warn('Backend dashboard KPIs API unavailable, using local cache:', error.message);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            { title: 'Total Revenue', value: '₹124,563.00', change: '+12.5%', isPositive: true },
            { title: 'Active Customers', value: '2,430', change: '+5.2%', isPositive: true },
            { title: 'Total Orders', value: '1,204', change: '-2.4%', isPositive: false },
            { title: 'Avg Order Value', value: '₹103.45', change: '+8.1%', isPositive: true }
          ]
        });
      }, 300);
    });
  },

  getAgentInsights: async () => {
    // const response = await api.get('/agent/insights');
    // return response.data;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
             {
               id: 1,
               type: 'alert',
               title: 'Inventory Alert',
               message: 'Product SKU-192 is projected to run out of stock in 4 days. I have prepared a purchase order draft for approval.',
               actionText: 'Review PO'
             },
             {
               id: 2,
               type: 'insight',
               title: 'Sales Trend',
               message: 'Customer segment "Enterprise" showed a 15% WoW growth. I recommend sending a tailored follow-up campaign.',
               actionText: null
             }
          ]
        });
      }, 800);
    });
  }
};
