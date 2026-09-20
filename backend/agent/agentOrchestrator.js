const AgentPlanner = require('./agentPlanner');
const AgentExecutor = require('./agentExecutor');
const AgentMemory = require('./agentMemory');
const AgentAction = require('../models/AgentAction');

class AgentOrchestrator {
  constructor(businessId) {
    this.businessId = businessId;
    this.memory = new AgentMemory(businessId);
    this.planner = new AgentPlanner();
    this.executor = new AgentExecutor(this.memory);
  }

  async run(trigger, goal) {
    console.log(`\n=============================================`);
    console.log(`[Orchestrator] Starting Agent Action`);
    console.log(`[Orchestrator] Business: ${this.businessId} | Trigger: ${trigger}`);
    console.log(`[Orchestrator] Goal: ${goal}`);
    console.log(`=============================================\n`);

    // 1. Create Audit Record in DB
    const actionRecord = await AgentAction.create({
      business: this.businessId,
      trigger: trigger,
      goal: goal,
      overallStatus: 'In Progress'
    });

    try {
      // 2. Planning Phase
      const { plan } = await this.planner.createPlan(goal, this.memory.getSummary());
      
      // Save plan to record
      actionRecord.plan = plan;
      await actionRecord.save();

      console.log(`[Orchestrator] Plan created with ${plan.length} steps.`);

      // 3. Execution Phase
      const executionSuccess = await this.executor.executePlan(plan, actionRecord);

      if (executionSuccess) {
        console.log(`\n[Orchestrator] Goal achieved successfully.`);
      } else {
        console.log(`\n[Orchestrator] Goal execution failed.`);
      }

      return actionRecord;

    } catch (error) {
      console.error(`[Orchestrator] Fatal Error:`, error);
      actionRecord.overallStatus = 'Failed';
      actionRecord.executionLog.push({
        stepNumber: 0,
        toolUsed: 'Orchestrator',
        status: 'Failed',
        result: { error: error.message }
      });
      await actionRecord.save();
      return actionRecord;
    }
  }
}

module.exports = AgentOrchestrator;
