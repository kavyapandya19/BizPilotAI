import api from './api';

export const inventoryService = {
  getInventory: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  restockItem: async (id) => {
    const response = await api.post(`/inventory/${id}/restock`);
    return response.data;
  },
};
