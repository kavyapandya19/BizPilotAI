import api from './api';

export const dashboardService = {
  getKPIs: async () => {
    const response = await api.get('/dashboard/kpis');
    return response.data;
  }
};
