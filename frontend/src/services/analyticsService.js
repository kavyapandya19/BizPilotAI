const unavailable = (name) => {
  throw new Error(`Backend analytics endpoint is not available for ${name}.`);
};

export const analyticsService = {
  getRevenueChart: async () => unavailable('revenue history'),
  getSalesByChannel: async () => unavailable('sales channels'),
  getTopProducts: async () => unavailable('top products'),
  getSummaryKPIs: async () => unavailable('analytics summary KPIs'),
};
