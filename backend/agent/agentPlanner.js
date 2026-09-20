const prompts = require('./agentPrompts');

class AgentPlanner {
  constructor(llmClient = null) {
    this.llm = llmClient; // Placeholder for real LLM client
  }

  async createPlan(goal, context) {
    console.log(`[Planner] Creating plan for goal: ${goal}`);
    
    // In a real implementation, we would call the LLM here using prompts.plannerPrompt
    // const response = await this.llm.chat({ messages: [...] });
    
    // MOCK LLM RESPONSE for Hackathon Phase 5
    // Simulating an LLM determining steps to handle low inventory
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          plan: [
            { stepNumber: 1, description: "Check current low stock inventory items", toolToUse: "checkInventory" },
            { stepNumber: 2, description: "Draft a purchase order for the low stock items", toolToUse: "draftPurchaseOrder" },
            { stepNumber: 3, description: "Notify the admin that a PO requires approval", toolToUse: "sendNotification" }
          ]
        });
      }, 1000); // simulate network delay
    });
  }
}

module.exports = AgentPlanner;
