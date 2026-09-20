class AgentMemory {
  constructor(businessId) {
    this.businessId = businessId;
    this.context = {};
    this.history = [];
  }

  updateContext(key, value) {
    this.context[key] = value;
  }

  getContext(key) {
    return this.context[key];
  }

  logHistory(action) {
    this.history.push({
      timestamp: new Date(),
      action
    });
  }

  getSummary() {
    return {
      context: this.context,
      historyCount: this.history.length
    };
  }
}

module.exports = AgentMemory;
