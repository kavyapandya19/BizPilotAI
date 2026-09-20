import api from './api';

export const inventoryService = {
  getInventory: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  restockItem: async (id) => {
    throw new Error(`Restock endpoint is not available in the backend for inventory item ${id}.`);
  },
};
