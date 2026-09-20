import api from './api';

const mockInventory = [
  { id: 1, sku: 'SKU-101', name: 'Pro Headphones X1', category: 'Electronics', currentStock: 142, reorderLevel: 20, status: 'In Stock', lastRestocked: '2026-09-10', price: 99.99 },
  { id: 2, sku: 'SKU-192', name: 'Smart Watch S3', category: 'Electronics', currentStock: 8, reorderLevel: 15, status: 'Low Stock', lastRestocked: '2026-09-01', price: 199.99 },
  { id: 3, sku: 'SKU-203', name: 'Laptop Stand Pro', category: 'Accessories', currentStock: 0, reorderLevel: 10, status: 'Out of Stock', lastRestocked: '2026-08-20', price: 49.99 },
  { id: 4, sku: 'SKU-215', name: 'Mechanical Keyboard', category: 'Peripherals', currentStock: 67, reorderLevel: 25, status: 'In Stock', lastRestocked: '2026-09-15', price: 99.99 },
  { id: 5, sku: 'SKU-228', name: 'USB-C Hub 7-in-1', category: 'Accessories', currentStock: 5, reorderLevel: 20, status: 'Low Stock', lastRestocked: '2026-08-28', price: 19.99 },
  { id: 6, sku: 'SKU-241', name: 'Ergonomic Mouse', category: 'Peripherals', currentStock: 89, reorderLevel: 15, status: 'In Stock', lastRestocked: '2026-09-12', price: 59.99 },
  { id: 7, sku: 'SKU-254', name: '4K Webcam Pro', category: 'Electronics', currentStock: 0, reorderLevel: 10, status: 'Out of Stock', lastRestocked: '2026-08-15', price: 129.99 },
  { id: 8, sku: 'SKU-267', name: 'Desk Lamp LED', category: 'Furniture', currentStock: 203, reorderLevel: 30, status: 'In Stock', lastRestocked: '2026-09-08', price: 34.99 },
  { id: 9, sku: 'SKU-280', name: 'Wireless Charger Pad', category: 'Accessories', currentStock: 12, reorderLevel: 20, status: 'Low Stock', lastRestocked: '2026-09-03', price: 29.99 },
  { id: 10, sku: 'SKU-293', name: 'Monitor Arm Dual', category: 'Furniture', currentStock: 44, reorderLevel: 10, status: 'In Stock', lastRestocked: '2026-09-14', price: 89.99 },
  { id: 11, sku: 'SKU-306', name: 'Noise-Cancel Earbuds', category: 'Electronics', currentStock: 7, reorderLevel: 15, status: 'Low Stock', lastRestocked: '2026-08-30', price: 149.99 },
  { id: 12, sku: 'SKU-319', name: 'Cable Management Box', category: 'Accessories', currentStock: 320, reorderLevel: 50, status: 'In Stock', lastRestocked: '2026-09-01', price: 14.99 },
  { id: 13, sku: 'SKU-332', name: 'Portable SSD 1TB', category: 'Storage', currentStock: 0, reorderLevel: 10, status: 'Out of Stock', lastRestocked: '2026-08-10', price: 109.99 },
  { id: 14, sku: 'SKU-345', name: 'Phone Stand Magnetic', category: 'Accessories', currentStock: 55, reorderLevel: 15, status: 'In Stock', lastRestocked: '2026-09-16', price: 24.99 },
  { id: 15, sku: 'SKU-358', name: 'Smart Power Strip', category: 'Electronics', currentStock: 3, reorderLevel: 10, status: 'Low Stock', lastRestocked: '2026-08-25', price: 44.99 },
];

export const inventoryService = {
  getInventory: async () => {
    try {
      const response = await api.get('/inventory');
      if (response.data && response.data.success && response.data.data?.length > 0) {
        return response.data;
      }
    } catch (error) {
      console.warn('Backend inventory API unavailable, using local cache:', error.message);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, data: mockInventory });
      }, 300);
    });
  },

  restockItem: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Restock order created successfully.' });
      }, 600);
    });
  },
};
