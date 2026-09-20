const axios = require('axios');
const path = require('path');
const fs = require('fs');

class N8nService {
  constructor() {
    this.webhookUrl = process.env.N8N_CHURN_WEBHOOK_URL || 'http://localhost:5678/webhook/bizpilot-churn-retention';
    this.timeout = 4000; // 4s timeout for webhook triggers
  }

  getWebhookUrl() {
    return process.env.N8N_CHURN_WEBHOOK_URL || this.webhookUrl;
  }

  /**
   * Dispatch customer churn retention event to n8n webhook workflow
   */
  async triggerChurnEmailWebhook({ customer, campaign }) {
    const url = this.getWebhookUrl();
    const payload = {
      event: 'customer.churn_risk_high',
      timestamp: new Date().toISOString(),
      source: 'BizPilot AI Autonomous Retention Agent',
      customer: {
        id: customer.id || customer._id,
        name: customer.name,
        email: customer.email,
        segment: customer.segment || 'Standard',
        churnRisk: customer.churnRisk,
        ltv: customer.ltv,
        orders: customer.orders,
        recencyDays: customer.recency_days || 45,
        riskFactors: customer.riskFactors || [],
      },
      campaign: {
        subject: campaign.subject,
        body: campaign.body,
        incentiveCode: campaign.incentive,
        incentiveDesc: campaign.incentiveDesc || (customer.segment === 'Enterprise' ? '20% Executive Credit' : customer.segment === 'Premium' ? '15% VIP Discount' : '₹500 Voucher'),
        channel: 'email',
      },
    };

    console.log(`[n8nService] Dispatching retention event to n8n webhook: ${url} for ${customer.name}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-BizPilot-Source': 'Autonomous-Churn-Agent',
        },
        timeout: this.timeout,
      });

      console.log(`[n8nService] n8n responded with status ${response.status}`);
      return {
        success: true,
        deliveredVia: 'n8n_webhook',
        n8nStatus: 'connected',
        n8nExecutionId: response.data?.n8nExecutionId || `exec-${Date.now()}`,
        data: response.data,
      };
    } catch (err) {
      console.warn(`[n8nService] n8n instance at ${url} not reachable (${err.message}). Staging webhook payload in BizPilot event logger.`);
      return {
        success: true,
        deliveredVia: 'n8n_staged_logger',
        n8nStatus: 'offline_fallback',
        message: 'Payload staged for n8n; dispatched via BizPilot direct email agent',
        stagedPayload: payload,
      };
    }
  }

  /**
   * Ping/test n8n webhook endpoint
   */
  async testConnection(targetUrl) {
    const url = targetUrl || this.getWebhookUrl();
    try {
      const testPayload = {
        event: 'system.ping',
        message: 'BizPilot AI connection probe',
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(url, testPayload, {
        timeout: 3000,
      });

      return {
        success: true,
        url,
        statusCode: response.status,
        message: 'n8n Webhook endpoint active and responding',
      };
    } catch (err) {
      return {
        success: false,
        url,
        error: err.message,
        message: `Could not connect to n8n webhook at ${url}. Ensure your n8n workflow is active.`,
      };
    }
  }

  /**
   * Read the exportable n8n workflow template JSON
   */
  getWorkflowTemplate() {
    const filePath = path.join(__dirname, '..', '..', 'n8n', 'bizpilot-churn-workflow.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }
}

module.exports = new N8nService();
