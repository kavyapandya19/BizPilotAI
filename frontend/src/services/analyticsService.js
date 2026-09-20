import api from './api';

const revenueData = {
  '7d': [
    { date: 'Sep 14', revenue: 3200, orders: 28 },
    { date: 'Sep 15', revenue: 4100, orders: 35 },
    { date: 'Sep 16', revenue: 3800, orders: 31 },
    { date: 'Sep 17', revenue: 5200, orders: 44 },
    { date: 'Sep 18', revenue: 4700, orders: 39 },
    { date: 'Sep 19', revenue: 6100, orders: 52 },
    { date: 'Sep 20', revenue: 5800, orders: 48 },
  ],
  '30d': [
    { date: 'Aug 21', revenue: 2800, orders: 24 },
    { date: 'Aug 24', revenue: 3500, orders: 29 },
    { date: 'Aug 27', revenue: 4100, orders: 35 },
    { date: 'Aug 30', revenue: 3700, orders: 31 },
    { date: 'Sep 02', revenue: 4800, orders: 41 },
    { date: 'Sep 05', revenue: 5200, orders: 44 },
    { date: 'Sep 08', revenue: 4600, orders: 38 },
    { date: 'Sep 11', revenue: 5900, orders: 50 },
    { date: 'Sep 14', revenue: 6400, orders: 54 },
    { date: 'Sep 17', revenue: 7100, orders: 60 },
    { date: 'Sep 20', revenue: 6800, orders: 57 },
  ],
  '90d': [
    { date: 'Jun 22', revenue: 18200, orders: 154 },
    { date: 'Jun 29', revenue: 21000, orders: 178 },
    { date: 'Jul 06', revenue: 19500, orders: 165 },
    { date: 'Jul 13', revenue: 24000, orders: 203 },
    { date: 'Jul 20', revenue: 22800, orders: 193 },
    { date: 'Jul 27', revenue: 26500, orders: 224 },
    { date: 'Aug 03', revenue: 28100, orders: 238 },
    { date: 'Aug 10', revenue: 27300, orders: 231 },
    { date: 'Aug 17', revenue: 31200, orders: 264 },
    { date: 'Aug 24', revenue: 29800, orders: 252 },
    { date: 'Aug 31', revenue: 34500, orders: 292 },
    { date: 'Sep 07', revenue: 33100, orders: 280 },
    { date: 'Sep 14', revenue: 36900, orders: 312 },
    { date: 'Sep 20', revenue: 38400, orders: 325 },
  ],
};

export const analyticsService = {
  getRevenueChart: async (range = '7d') => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, data: revenueData[range] || revenueData['7d'] });
      }, 400);
    });
  },

  getSalesByChannel: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            { name: 'Online', value: 52, color: '#0ea5e9' },
            { name: 'In-Store', value: 23, color: '#818cf8' },
            { name: 'B2B', value: 18, color: '#34d399' },
            { name: 'Other', value: 7, color: '#fb923c' },
          ],
        });
      }, 300);
    });
  },

  getTopProducts: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            { name: 'Pro Headphones X1', revenue: 18400, units: 184 },
            { name: 'Smart Watch S3', revenue: 15200, units: 76 },
            { name: 'Laptop Stand Pro', revenue: 11900, units: 238 },
            { name: 'Mechanical Keyboard', revenue: 9800, units: 98 },
            { name: 'USB-C Hub 7-in-1', revenue: 7600, units: 380 },
          ],
        });
      }, 350);
    });
  },

  getSummaryKPIs: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            totalRevenue: '₹124,563',
            revenueChange: '+12.5%',
            totalOrders: '1,204',
            ordersChange: '-2.4%',
            avgOrderValue: '₹103.45',
            aovChange: '+8.1%',
            revenueGrowth: '18.2%',
            growthChange: '+3.1%',
          },
        });
      }, 200);
    });
  },
};
