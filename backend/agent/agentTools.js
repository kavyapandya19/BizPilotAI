const Inventory = require('../models/Inventory');

const agentTools = {
  checkInventory: async (businessId) => {
    console.log(`[Tool: checkInventory] Checking low stock for business ${businessId}`);
    try {
      const lowStockItems = await Inventory.find({ 
        business: businessId,
        status: { $in: ['Low Stock', 'Out of Stock'] }
      }).populate('product');
      
      return {
        success: true,
        data: lowStockItems.map(item => ({
          sku: item.product.sku,
          name: item.product.name,
          currentStock: item.currentStock,
          status: item.status
        }))
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  draftPurchaseOrder: async (data) => {
    console.log(`[Tool: draftPurchaseOrder] Drafting PO for ${data.items?.length || 0} items`);
    // In a real app, this would create a Draft record in the DB
    return {
      success: true,
      message: "Purchase Order drafted successfully",
      poNumber: `PO-${Math.floor(Math.random() * 10000)}`
    };
  },

  sendNotification: async (message) => {
    console.log(`[Tool: sendNotification] Sending alert: ${message}`);
    // In a real app, this would use WebSockets or Email
    return { success: true, message: "Notification sent" };
  }
};

module.exports = agentTools;
