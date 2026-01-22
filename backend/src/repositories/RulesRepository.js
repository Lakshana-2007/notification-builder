/**
 * RulesRepository.js
 * Handles data persistence and live database execution.
 * Optimized for cross-database querying based on dynamic rules.
 */
const { getDbPool } = require("../db/mysql");

class RulesRepository {
  constructor() {
    // Primary pool for storing the rules themselves
    this.pool = getDbPool("doctor_db");
  }

  /**
   * Fetches all defined rules.
   */
  async listRules() {
    const [rows] = await this.pool.query(
      `
      SELECT 
        id, name, description, is_enabled AS isEnabled, 
        target_database AS targetDatabase, 
        target_table AS targetTable, 
        target_column AS targetColumn, 
        target_column_type AS targetColumnType, 
        operator_key AS operatorKey, 
        compare_value AS compareValue, 
        rule_json AS ruleJson, 
        created_at AS createdAt, 
        updated_at AS updatedAt
      FROM notification_rules
      ORDER BY updated_at DESC
      `
    );
    // Convert 1/0 to Boolean for Frontend compatibility
    return rows.map(r => ({ ...r, isEnabled: !!r.isEnabled }));
  }

  /**
   * Executes the rule against the ACTUAL target database to fetch matched rows.
   * This is called when a rule is triggered to "print" the whole column/row data.
   */
  async executeLiveRule(rule) {
    try {
      // 1. Get the pool for the specific database mentioned in the rule
      const targetPool = getDbPool(rule.targetDatabase);

      // 2. Map frontend operators to valid SQL operators
      const sqlOperators = {
        'equals': '=',
        '=': '=',
        'greater_than': '>',
        '>': '>',
        'less_than': '<',
        '<': '<',
        'contains': 'LIKE',
        'startsWith': 'LIKE'
      };

      const operator = sqlOperators[rule.operatorKey] || '=';
      let value = rule.compareValue;

      // Handle wildcard for LIKE operators
      if (rule.operatorKey === 'contains') value = `%${value}%`;
      if (rule.operatorKey === 'startsWith') value = `${value}%`;

      // 3. Construct the query
      // Using backticks for identifiers to prevent SQL errors with reserved words
      const sql = `
        SELECT * FROM \`${rule.targetTable}\` 
        WHERE \`${rule.targetColumn}\` ${operator} ?
      `;

      const [rows] = await targetPool.query(sql, [value]);
      return rows;
    } catch (error) {
      console.error("Live Execution Error:", error);
      throw new Error(`Failed to fetch matching rows from ${rule.targetDatabase}: ${error.message}`);
    }
  }

  async createRule(rule) {
    const [result] = await this.pool.query(
      `
      INSERT INTO notification_rules 
        (name, description, is_enabled, target_database, target_table, target_column, target_column_type, operator_key, compare_value, rule_json)
      VALUES 
        (:name, :description, :isEnabled, :targetDatabase, :targetTable, :targetColumn, :targetColumnType, :operatorKey, :compareValue, CAST(:ruleJson AS JSON))
      `,
      {
        name: rule.name,
        description: rule.description || null,
        isEnabled: rule.isEnabled ? 1 : 0,
        targetDatabase: rule.targetDatabase,
        targetTable: rule.targetTable,
        targetColumn: rule.targetColumn,
        targetColumnType: rule.targetColumnType,
        operatorKey: rule.operatorKey,
        compareValue: rule.compareValue ?? null,
        ruleJson: JSON.stringify(rule.ruleJson || {}),
      }
    );

    return { id: Number(result.insertId) };
  }

  async insertExecutionLog(log) {
    const [result] = await this.pool.query(
      `
      INSERT INTO rule_execution_logs 
        (rule_id, input_payload, result, reason, matching_data, condition_snapshot)
      VALUES 
        (:ruleId, CAST(:inputPayload AS JSON), :result, :reason, CAST(:matchingData AS JSON), CAST(:conditionSnapshot AS JSON))
      `,
      {
        ruleId: log.ruleId,
        inputPayload: JSON.stringify(log.inputPayload),
        result: log.result ? 1 : 0,
        reason: log.reason,
        matchingData: JSON.stringify(log.matchingData ?? null),
        conditionSnapshot: JSON.stringify(log.conditionSnapshot),
      }
    );
    return { id: Number(result.insertId) };
  }

  async listRuleLogs(ruleId, limit = 50) {
    const [rows] = await this.pool.query(
      `
      SELECT 
        id, 
        rule_id AS ruleId, 
        executed_at AS executedAt, 
        input_payload AS inputPayload, 
        result, 
        reason, 
        matching_data AS matchingData, 
        condition_snapshot AS conditionSnapshot
      FROM rule_execution_logs
      WHERE rule_id = :ruleId
      ORDER BY executed_at DESC
      LIMIT :limit
      `,
      { ruleId: Number(ruleId), limit: Number(limit) }
    );
    return rows.map((r) => ({ ...r, result: !!r.result }));
  }
}

module.exports = { RulesRepository };