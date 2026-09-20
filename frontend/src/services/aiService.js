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

Respond in a helpful, concise, and professional tone. Use **bold** for key metrics and important terms. Use line breaks to separate ideas. Be proactive — suggest next steps and actions. Keep responses focused and under 200 words unless a detailed breakdown is requested.`;

// Multi-turn chat state
let chatHistory = [];
let activeModelIndex = 0;

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

    return {
      success: false,
      message: API_KEY
        ? `AI service unavailable: ${lastError?.message || 'request failed'}`
        : 'AI service is not configured. Add VITE_GEMINI_API_KEY to enable it.',
    };
  },

  resetChat: () => {
    chatHistory = [];
    activeModelIndex = 0;
  },
};
