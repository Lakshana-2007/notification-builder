/**
 * RulesController.js
 * Principal Architect Version: Handles orchestration between 
 * the logic engine and live database execution.
 */
const { RulesService } = require("../services/RulesService");
const { httpError } = require("../utils/httpError");

class RulesController {
  constructor() {
    this.service = new RulesService();
  }

  /**
   * Fetch all saved notification strategies.
   */
  async listRules(req, res) {
    const rules = await this.service.listRules();
    res.json({ success: true, rules });
  }

  /**
   * Persist a new data-driven rule.
   */
  async createRule(req, res) {
    // Principal Architect Note: Service layer handles the normalization 
    // we discussed (Boolean casting, etc.)
    const created = await this.service.createRule(req.body);
    res.status(201).json({ success: true, rule: created });
  }

  /**
   * Core Evaluation Logic
   * 1. Evaluates rule against Mock JSON (Frontend feedback)
   * 2. IF Triggered: Fetches REAL matching rows from the target DB
   */
  async testRule(req, res) {
    const { rule, payload, saveLog, ruleId } = req.body;

    if (!rule || !payload) {
      throw httpError(400, "Missing rule definition or test payload", "ERR_MISSING_BODY");
    }

    // This service call now returns { result, reason, matchingData, liveMatches }
    const outcome = await this.service.testRule({
      rule,
      payload,
      saveLog: !!saveLog,
      ruleId: ruleId ? Number(ruleId) : null
    });

    res.json(outcome);
  }

  /**
   * Retrieve execution history for the audit timeline.
   */
  async listRuleLogs(req, res) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      throw httpError(400, "Invalid rule ID provided", "ERR_VALIDATION");
    }

    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await this.service.listRuleLogs(id, limit);
    
    res.json({ 
      success: true,
      ruleId: id, 
      logs 
    });
  }
}

module.exports = { RulesController };