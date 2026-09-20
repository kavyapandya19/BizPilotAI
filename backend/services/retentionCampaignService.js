const axios = require('axios');

const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
});

const buildSafeMessage = (customer, businessName) => {
  const customerName = customer.name || 'there';
  const segment = customer.segment || 'Standard';
  const ltv = Number(customer.ltv || 0).toLocaleString();
  const risk = Number(customer.churnRisk || 0);
  const businessLabel = businessName || 'our team';

  return {
    subject: `A personal note from ${businessLabel}`,
    body: `Hello ${customerName},\n\nWe are reaching out because your ${segment} account currently has a churn-risk score of ${risk}%. Your recorded lifetime value with us is ₹${ltv}.\n\nWe would value the opportunity to understand what would make ${businessLabel} more useful for you. Please reply to this email and our customer success team will help with a plan tailored to your needs.\n\nBest regards,\nCustomer Success Team\n${businessLabel}`,
    incentive: null,
    incentiveDesc: null,
    aiGenerated: false,
  };
};

const parseGeminiResponse = (payload) => {
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.subject || !parsed.body) return null;

  return {
    subject: String(parsed.subject),
    body: String(parsed.body),
    incentive: null,
    incentiveDesc: null,
    aiGenerated: true,
  };
};

const generateRetentionMessage = async (customer, businessName) => {
  const config = getGeminiConfig();
  if (!config.apiKey) return buildSafeMessage(customer, businessName);

  const facts = {
    name: customer.name || null,
    segment: customer.segment || null,
    lifetimeValue: customer.ltv || 0,
    churnRisk: customer.churnRisk || 0,
    businessName: businessName || null,
  };

  const prompt = `Create a concise, professional customer retention email using only the facts below. Do not invent purchases, products, dates, discounts, vouchers, coupon codes, incentives, or other customer facts. Do not claim an email was sent. Ask the customer to reply so the team can discuss a plan. Return strict JSON with string keys "subject" and "body" only.\n\nFacts: ${JSON.stringify(facts)}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const response = await axios.post(url, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
    }, { timeout: 10000 });

    return parseGeminiResponse(response.data) || buildSafeMessage(customer, businessName);
  } catch (error) {
    console.warn(`[RetentionCampaign] AI generation unavailable: ${error.message}`);
    return buildSafeMessage(customer, businessName);
  }
};

module.exports = { generateRetentionMessage };
