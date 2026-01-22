/**
 * RulesService.js
 * Optimized for Production: Handles strict type validation and live data fetching.
 * Fixes: ruleId validation mismatch between frontend and backend.
 */
const { z } = require("zod");
const { RulesRepository } = require("../repositories/RulesRepository");
const { RuleEngine } = require("./RuleEngine");
const { httpError } = require("../utils/httpError");

// Zod schema for rule creation
const createRuleSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().max(400).optional().nullable(),
  isEnabled: z.boolean().optional().default(true),
  targetDatabase: z.string().min(1).max(64),
  targetTable: z.string().min(1).max(64),
  targetColumn: z.string().min(1).max(64),
  targetColumnType: z.string().min(1).max(64),
  operatorKey: z.string().min(1).max(32),
  compareValue: z.any().optional().nullable(),
});

// Zod schema for testing (Evaluation)
// FIX: Added .nullable() to ruleId to prevent crash when rule isn't saved yet
const testRuleSchema = z.object({
  rule: createRuleSchema,
  payload: z.any(),
  saveLog: z.boolean().optional().default(false),
  ruleId: z.number().int().positive().optional().nullable(),
});

class RulesService {
  constructor() {
    this.repo = new RulesRepository();
    this.engine = new RuleEngine();
  }

  async listRules() {
    return await this.repo.listRules();
  }

  async createRule(input) {
    const parsed = createRuleSchema.safeParse(input);
    if (!parsed.success) {
      throw httpError(400, parsed.error.message, "ERR_VALIDATION");
    }

    const rule = parsed.data;

    const ruleJson = {
      version: 1,
      kind: "single_condition",
      target: {
        database: rule.targetDatabase,
        table: rule.targetTable,
        column: rule.targetColumn,
        columnType: rule.targetColumnType,
      },
      condition: {
        operatorKey: rule.operatorKey,
        compareValue: rule.compareValue ?? null,
      },
    };

    const created = await this.repo.createRule({
      ...rule,
      ruleJson,
    });

    return { id: created.id };
  }

  /**
   * Evaluates a rule and fetches live data if triggered.
   * Includes fix for ruleId null validation.
   */
  async testRule(input) {
    const parsed = testRuleSchema.safeParse(input);
    
    if (!parsed.success) {
      // Detailed error reporting for debugging
      const errorDetail = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(", ");
      throw httpError(400, `Validation Failed: ${errorDetail}`, "ERR_VALIDATION");
    }

    const { rule, payload, saveLog, ruleId } = parsed.data;

    // 1. EVALUATE: Logic check against Mock Payload
    const outcome = this.engine.evaluate(rule, payload);

    // 2. LIVE FETCH: Fetch actual database rows if logic triggered
    let liveMatches = [];
    if (outcome.result === true) {
      try {
        liveMatches = await this.repo.executeLiveRule(rule);
      } catch (err) {
        console.error("Live fetch error:", err.message);
      }
    }

    // 3. LOGGING: Archive snapshot
    if (saveLog) {
      // Functional Constraint: ruleId MUST exist to save to database
      if (!ruleId) {
        throw httpError(400, "ruleId is required when saveLog=true", "ERR_VALIDATION");
      }

      await this.repo.insertExecutionLog({
        ruleId: Number(ruleId),
        inputPayload: payload,
        result: outcome.result,
        reason: outcome.reason,
        matchingData: outcome.matchingData,
        conditionSnapshot: {
          targetDatabase: rule.targetDatabase,
          targetTable: rule.targetTable,
          targetColumn: rule.targetColumn,
          targetColumnType: rule.targetColumnType,
          operatorKey: rule.operatorKey,
          compareValue: rule.compareValue ?? null,
        },
      });
    }

    // 4. RETURN: Evaluation + Live Data "Printing"
    return {
      ...outcome,
      liveMatches 
    };
  }

  async listRuleLogs(ruleId, limit) {
    if (!Number.isFinite(Number(ruleId))) {
      throw httpError(400, "Invalid rule id", "ERR_VALIDATION");
    }
    return await this.repo.listRuleLogs(ruleId, limit ?? 50);
  }
}

module.exports = { RulesService };