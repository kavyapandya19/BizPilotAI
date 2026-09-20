import api from './api';

export const customerService = {
  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },
};
