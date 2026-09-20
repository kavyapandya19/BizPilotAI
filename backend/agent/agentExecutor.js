const tools = require('./agentTools');

class AgentExecutor {
  constructor(memory) {
    this.memory = memory;
  }

  async executePlan(plan, actionRecord) {
    console.log(`[Executor] Starting execution of ${plan.length} steps`);
    
    const results = [];

    for (const step of plan) {
      console.log(`[Executor] Executing Step ${step.stepNumber}: ${step.description}`);
      
      const toolFunction = tools[step.toolToUse];
      
      let stepResult;
      if (toolFunction) {
        // Pass context if needed. For simplicity, just passing businessId or general memory context
        try {
          const params = this.getToolParams(step.toolToUse);
          stepResult = await toolFunction(params);
          
          // Update memory with result
          this.memory.updateContext(`step_${step.stepNumber}_result`, stepResult);
          
        } catch (error) {
          stepResult = { success: false, error: error.message };
        }
      } else {
        stepResult = { success: false, error: `Tool ${step.toolToUse} not found` };
      }

      // Log execution to DB record
      actionRecord.executionLog.push({
        stepNumber: step.stepNumber,
        toolUsed: step.toolToUse,
        result: stepResult,
        status: stepResult.success ? 'Success' : 'Failed'
      });
      await actionRecord.save();
      
      results.push(stepResult);

      // Stop execution if a critical step fails
      if (!stepResult.success) {
        console.log(`[Executor] Step ${step.stepNumber} failed. Halting execution.`);
        actionRecord.overallStatus = 'Failed';
        await actionRecord.save();
        return false;
      }
    }

    actionRecord.overallStatus = 'Completed';
    actionRecord.completedAt = Date.now();
    await actionRecord.save();
    
    console.log(`[Executor] Execution completed successfully.`);
    return true;
  }

  // Helper to extract parameters needed for tools based on current memory
  getToolParams(toolName) {
    switch (toolName) {
      case 'checkInventory':
        return this.memory.businessId;
      case 'draftPurchaseOrder':
        const invResult = this.memory.getContext('step_1_result');
        return { items: invResult?.data || [] };
      case 'sendNotification':
        return "A new Purchase Order has been drafted by BizPilot AI and requires your approval.";
      default:
        return null;
    }
  }
}

module.exports = AgentExecutor;
