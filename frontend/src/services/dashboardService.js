import api from './api';

export const dashboardService = {
  getKPIs: async () => {
    const response = await api.get('/dashboard/kpis');
    return response.data;
  },
  getAIInsights: async () => {
    const response = await api.get('/ai-insights?limit=50');
    return response.data;
  },
  deleteAIInsight: async (id) => {
    const response = await api.delete(`/ai-insights/${id}`);
    return response.data;
  }
};
