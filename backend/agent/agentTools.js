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
  },

  sendRetentionEmail: async ({ customerId, customerName, email, segment, churnScore, subject, body, incentive }) => {
    console.log(`[AI Agent] Dispatching Personalized Retention Email to ${customerName} (${email}) | Churn Risk: ${churnScore}%`);
    const Customer = require('../models/Customer');

    const defaultIncentive = segment === 'Enterprise'
      ? 'VIP-ENTERPRISE-20'
      : segment === 'Premium'
      ? 'VIP-SAVE15'
      : 'COMEBACK500';

    const selectedIncentive = incentive || defaultIncentive;
    const emailSubject = subject || `Special Appreciation Offer for ${customerName} from BizPilot`;
    const emailBody = body || `Dear ${customerName},\n\nWe noticed you haven't placed an order recently. As a valued ${segment} customer, we'd love to welcome you back with code ${selectedIncentive}.\n\nBest regards,\nBizPilot Team`;

    // Dispatch event to n8n Webhook Workflow Engine
    const n8nService = require('../services/n8nService');
    const n8nResult = await n8nService.triggerChurnEmailWebhook({
      customer: {
        id: customerId,
        name: customerName,
        email,
        segment,
        churnRisk: churnScore,
      },
      campaign: {
        subject: emailSubject,
        body: emailBody,
        incentive: selectedIncentive,
      },
    });

    let updateResult = null;
    if (customerId) {
      updateResult = await Customer.findByIdAndUpdate(
        customerId,
        {
          $set: {
            'retentionCampaign.status': 'Sent',
            'retentionCampaign.lastSentAt': new Date(),
            'retentionCampaign.subject': emailSubject,
            'retentionCampaign.incentive': selectedIncentive,
            'retentionCampaign.churnScoreAtSend': churnScore,
            'retentionCampaign.channel': 'n8n_webhook',
            'retentionCampaign.n8nExecutionId': n8nResult.n8nExecutionId || 'n8n-staged',
          },
        },
        { new: true }
      );
    }

    return {
      success: true,
      deliveredAt: new Date().toISOString(),
      recipient: {
        name: customerName,
        email: email,
        segment: segment,
      },
      campaign: {
        subject: emailSubject,
        body: emailBody,
        incentive: selectedIncentive,
        status: 'Delivered',
        channel: 'n8n_webhook',
        n8nDelivery: n8nResult,
      },
      customer: updateResult,
    };
  }
};

module.exports = agentTools;
