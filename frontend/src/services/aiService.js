import { GoogleGenerativeAI } from '@google/generative-ai';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const API_KEY = getEnv('VITE_GEMINI_API_KEY');

// Supported Gemini models ordered by priority with automatic failover
const CANDIDATE_MODELS = [
  getEnv('VITE_GEMINI_MODEL'),
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
].filter((m, i, arr) => m && arr.indexOf(m) === i);

const SYSTEM_PROMPT = `You are BizPilot AI, an autonomous AI-powered business intelligence assistant embedded in a business management platform called BizPilot AI.

Your role is to help business owners and managers with:
- Inventory management and restocking recommendations
- Revenue trend analysis and sales insights
- Customer retention, churn risk identification, and LTV analysis
- Business performance summaries and KPIs
- Sales forecasting and demand planning
- Automated reporting and actionable recommendations
- Purchase orders and business document drafting

You have access to the following simulated business context:
- Inventory: SKU-192 (Smart Watch S3) is critically low at 8 units (reorder level: 15). 4K Webcam Pro, Laptop Stand Pro, and Portable SSD 1TB are out of stock. USB-C Hub 7-in-1 will run out in ~3 days.
- Revenue: This week's revenue is ₹32,900 (up 12.5% from last week). Best day: Thursday (₹6,100). Enterprise segment drives 52% of revenue. AOV is ₹103.45.
- Customers: 3 high churn-risk customers (score >70%): Priya Sharma, Tom Bauer, Aisha Patel. Top customer David Kim (LTV ₹31,500) hasn't ordered in 6 weeks. Enterprise segment = 68% of LTV with only 25% of customer count.

Respond in a helpful, concise, and professional tone. Use **bold** for key metrics and important terms. Use line breaks to separate ideas. Be proactive — suggest next steps and actions. Keep responses focused and under 200 words unless a detailed breakdown is requested.`;

// Multi-turn chat state
let chatHistory = [];
let activeModelIndex = 0;

// Contextual fallback generator if all remote API models are unreachable or throttled
const generateFallbackInsight = (userMessage) => {
  const q = (userMessage || '').toLowerCase();

  if (q.includes('inventory') || q.includes('restock') || q.includes('stock') || q.includes('sku') || q.includes('low')) {
    return `📦 **Inventory Restocking Intelligence:**
- **Critically Low:** **Smart Watch S3 (SKU-192)** has only **8 units left** (reorder threshold is 15 units).
- **Out of Stock (3 items):** **4K Webcam Pro**, **Laptop Stand Pro**, and **Portable SSD 1TB** are at zero stock.
- **Velocity Alert:** **USB-C Hub 7-in-1** has approximately **3 days of supply** remaining before stockout.

**Recommended Action:** Create an expedited purchase order for 50 units of SKU-192 and initiate vendor replenishment for the 3 zero-inventory items immediately.`;
  }

  if (q.includes('revenue') || q.includes('sales') || q.includes('trend') || q.includes('money') || q.includes('earn')) {
    return `📈 **Revenue & Sales Insights:**
- **Weekly Revenue:** **₹32,900**, representing a **+12.5% increase** compared to the previous week.
- **Top Day:** **Thursday** generated the highest daily revenue (**₹6,100**).
- **Key Driver:** The **Enterprise segment** accounts for **52%** of total revenue with an Average Order Value (AOV) of **₹103.45**.

**Recommended Action:** Focus on enterprise renewal incentives and schedule midweek promotions to maximize high-conversion days.`;
  }

  if (q.includes('churn') || q.includes('customer') || q.includes('retention') || q.includes('risk') || q.includes('david') || q.includes('priya')) {
    return `⚠️ **Customer Retention & Churn Watchlist:**
- **High Churn Risk Customers (>70% score):**
  1. **Priya Sharma** (78% risk score)
  2. **Tom Bauer** (74% risk score)
  3. **Aisha Patel** (71% risk score)
- **High-Value At-Risk Account:** Top customer **David Kim (LTV ₹31,500)** has not placed an order in over 6 weeks.
- **Revenue Concentration:** Enterprise clients contribute **68% of Total Customer LTV** despite representing only 25% of total accounts.

**Recommended Action:** Launch a targeted VIP re-engagement campaign offering a 15% renewal discount.`;
  }

  if (q.includes('performance') || q.includes('summar') || q.includes('kpi') || q.includes('metric') || q.includes('health') || q.includes('business')) {
    return `📊 **Business Performance Executive Summary:**
- **Overall Health Score:** **88/100 (Strong)**
- **Revenue Velocity:** **₹32,900** weekly (+12.5% WoW growth)
- **Active Customer Base:** **1,248 accounts** (28 new this week)
- **Inventory Status:** 1 critical alert (SKU-192) and 3 stockouts needing PO dispatch

**Strategic Focus:** Restock high-margin hardware SKUs immediately to capture pending enterprise replenishment orders.`;
  }

  if (q.includes('purchase order') || q.includes('order') || q.includes('draft') || q.includes('po') || q.includes('supplier')) {
    return `📝 **Purchase Order Draft (#PO-2026-089):**
- **Supplier:** Premier Distribution Logistics
- **Target Items:**
  1. **Smart Watch S3 (SKU-192):** 50 units @ ₹4,500/unit = **₹2,25,000**
  2. **4K Webcam Pro (SKU-104):** 30 units @ ₹3,200/unit = **₹96,000**
  3. **Portable SSD 1TB (SKU-205):** 25 units @ ₹5,100/unit = **₹1,27,500**
- **Estimated Total:** **₹4,48,500** (Net 30 terms)

Would you like to authorize this purchase order draft?`;
  }

  return `🤖 **BizPilot AI Business Co-Pilot:**
I've analyzed your current enterprise telemetry across sales, inventory, and customer databases:
- **Weekly Revenue:** **₹32,900** (+12.5% week-over-week)
- **Critical Action Item:** **Smart Watch S3 (SKU-192)** is down to 8 units.
- **Retention Alert:** **David Kim (LTV ₹31,500)** requires re-engagement.

You can ask me to draft purchase orders, break down churn probabilities, or analyze your sales trends!`;
};

export const aiService = {
  sendMessage: async (message) => {
    let lastError = null;

    if (API_KEY) {
      const genAI = new GoogleGenerativeAI(API_KEY);

      // Attempt candidate models with automatic failover
      for (let attempt = 0; attempt < CANDIDATE_MODELS.length; attempt++) {
        const modelName = CANDIDATE_MODELS[(activeModelIndex + attempt) % CANDIDATE_MODELS.length];
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT,
          });

          const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
              maxOutputTokens: 512,
              temperature: 0.7,
            },
          });

          const result = await chat.sendMessage(message);
          const text = result.response.text();

          // Save successful model index and history
          activeModelIndex = (activeModelIndex + attempt) % CANDIDATE_MODELS.length;
          chatHistory.push({ role: 'user', parts: [{ text: message }] });
          chatHistory.push({ role: 'model', parts: [{ text }] });

          return {
            success: true,
            data: {
              id: Date.now(),
              role: 'assistant',
              content: text,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (error) {
          console.warn(`[BizPilot AI] Model ${modelName} failed, trying next candidate:`, error.message);
          lastError = error;
        }
      }
    }

    // If all models or API calls failed (quota, network, demand spikes), use contextual business fallback
    console.warn('[BizPilot AI] Remote Gemini API unavailable, utilizing contextual intelligence engine:', lastError?.message);
    const fallbackText = generateFallbackInsight(message);

    // Keep history consistent
    chatHistory.push({ role: 'user', parts: [{ text: message }] });
    chatHistory.push({ role: 'model', parts: [{ text: fallbackText }] });

    return {
      success: true,
      data: {
        id: Date.now(),
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toISOString(),
      },
    };
  },

  resetChat: () => {
    chatHistory = [];
    activeModelIndex = 0;
  },

  /**
   * AI Agent: Generate a tailored win-back retention email based on customer churn profile
   */
  generateWinBackEmail: async (customer) => {
    const firstName = customer.name ? customer.name.split(' ')[0] : 'Valued Customer';
    const segment = customer.segment || 'Standard';
    const churnRisk = customer.churnRisk || 75;
    const ltv = customer.ltv ? `₹${Math.round(customer.ltv).toLocaleString()}` : '₹0';
    const recencyDays = customer.recency_days || 45;
    const orders = customer.orders || 1;
    const riskDrivers = customer.riskFactors && customer.riskFactors.length > 0
      ? customer.riskFactors.join(', ')
      : 'Inactivity interval and reduced reorder velocity';

    const incentiveCode = segment === 'Enterprise'
      ? 'VIP-ENTERPRISE-20'
      : segment === 'Premium'
      ? 'VIP-SAVE15'
      : 'COMEBACK500';

    const incentiveDesc = segment === 'Enterprise'
      ? '20% Executive Loyalty Renewal Credit + Dedicated Account Review'
      : segment === 'Premium'
      ? '15% VIP Replenishment Discount on any cart'
      : '₹500 Welcome-Back Voucher on your next restock';

    // Try generating with Gemini first
    if (API_KEY) {
      try {
        const ai = new GoogleGenerativeAI(API_KEY);
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are BizPilot AI's autonomous retention agent. Draft a personalized, persuasive B2B customer win-back email for this high churn risk account.

Customer Churn Profile:
- Name: ${customer.name}
- Segment Tier: ${segment}
- Churn Risk Score: ${churnRisk}% (RandomForest Machine Learning Assessment)
- Inactivity: ${recencyDays} days since last purchase
- Lifetime Value (LTV): ${ltv} (${orders} total orders)
- Model Risk Drivers: ${riskDrivers}
- Assigned Incentive: ${incentiveDesc} (Code: ${incentiveCode})

Guidelines:
1. Provide a professional, warm, and compelling Subject line.
2. Address them as ${firstName}.
3. Acknowledge their past loyalty and order history tastefully without sounding robotic.
4. Reference the special ${incentiveDesc} prominently with coupon code ${incentiveCode}.
5. Conclude with a clear call-to-action and contact signature from "Customer Success Team | BizPilot AI".

Format output strictly as JSON with keys "subject" and "body".`;

        const res = await model.generateContent(prompt);
        const responseText = res.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            subject: parsed.subject,
            body: parsed.body,
            incentiveCode,
            incentiveDesc,
            aiGenerated: true,
          };
        }
      } catch (err) {
        console.warn('[BizPilot AI] Gemini win-back generation fell back to profile template engine:', err.message);
      }
    }

    // High-quality contextual profile fallback
    const fallbackSubject = segment === 'Enterprise'
      ? `Exclusive 20% Partnership Loyalty Credit for ${customer.name} — BizPilot Priority`
      : segment === 'Premium'
      ? `We miss you, ${firstName}! Here is 15% off your next restock`
      : `Special ₹500 Welcome-Back Credit for ${customer.name}`;

    const fallbackBody = `Dear ${firstName},

We noticed that it has been over ${recencyDays} days since your last order with BizPilot. Across your ${orders} previous order${orders > 1 ? 's' : ''}, your total business value has reached ${ltv}, and your account is deeply appreciated.

Our autonomous account monitor detected recent dormancy in your ordering cycle (${riskDrivers}). To ensure you have seamless access to our inventory and best pricing:

🎁 We have activated an exclusive retention credit for your ${segment} account:
${incentiveDesc}
Promo Code: ${incentiveCode} (Valid for the next 14 days)

Whether you need expedited bulk shipping or custom product quantities, our support desk is ready to prioritize your request.

You can claim this directly on your dashboard or reply to this message to coordinate with an account representative.

Warm regards,
Customer Success Operations
BizPilot AI Autonomous Platform`;

    return {
      success: true,
      subject: fallbackSubject,
      body: fallbackBody,
      incentiveCode,
      incentiveDesc,
      aiGenerated: false,
    };
  },
};
