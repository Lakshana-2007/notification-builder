/**
 * RuleEngine.js - Production Grade
 * Architect: Principal / UI/UX: Elite
 * * Features: 
 * - Date-only comparison (ignores time/timezone noise)
 * - Case-insensitive string matching
 * - Robust nested value extraction
 */
const { httpError } = require("../utils/httpError");

function normalizeOperatorKey(op) {
  return String(op || "").trim().toLowerCase();
}

function classifyColumnType(columnType) {
  const t = String(columnType || "").toLowerCase();
  if (t.includes("int") || t.includes("decimal") || t.includes("numeric") || t.includes("float") || t.includes("double")) {
    return "number";
  }
  if (t.includes("date") || t.includes("time") || t.includes("year")) {
    return "date";
  }
  return "string";
}

function parseNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return null;
}

function parseDateString(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  // Format to YYYY-MM-DD to eliminate time/timezone comparison issues
  return d.toISOString().split('T')[0];
}

function extractValue(payload, { database, table, column }) {
  if (!payload || typeof payload !== "object") return { found: false };

  // 1. Direct match (Flat JSON)
  if (Object.prototype.hasOwnProperty.call(payload, column))
    return { found: true, value: payload[column], path: [column] };

  // 2. Table nested
  if (table && payload[table] && typeof payload[table] === "object") {
    if (Object.prototype.hasOwnProperty.call(payload[table], column))
      return { found: true, value: payload[table][column], path: [table, column] };
  }

  // 3. DB > Table nested
  if (database && payload[database]?.[table] && typeof payload[database][table] === "object") {
    if (Object.prototype.hasOwnProperty.call(payload[database][table], column))
      return { found: true, value: payload[database][table][column], path: [database, table, column] };
  }

  return { found: false };
}

class RuleEngine {
  evaluate(rule, payload) {
    const rawOp = normalizeOperatorKey(rule.operatorKey || rule.operator);
    const columnType = classifyColumnType(rule.targetColumnType || rule.fieldType);

    const extracted = extractValue(payload, {
      database: rule.targetDatabase || rule.database,
      table: rule.targetTable || rule.table,
      column: rule.targetColumn || rule.field,
    });

    if (!extracted.found) {
      return {
        result: false,
        reason: `Value for column "${rule.targetColumn || rule.field}" not found in test payload.`,
        matchingData: { lookedFor: rule.targetColumn || rule.field },
      };
    }

    const actual = extracted.value;
    const expected = rule.compareValue || rule.value;
    const matchingData = { path: extracted.path, actual, expected, operator: rawOp };

    // --- NUMBER LOGIC ---
    if (columnType === "number") {
      const a = parseNumber(actual);
      const b = parseNumber(expected);
      if (a === null || (rawOp !== 'empty' && rawOp !== 'filled' && b === null)) {
        return { result: false, reason: "Numeric comparison failed: Invalid numeric values.", matchingData };
      }

      const ops = {
        ">": (x, y) => x > y,
        "greater_than": (x, y) => x > y,
        "<": (x, y) => x < y,
        "less_than": (x, y) => x < y,
        "=": (x, y) => x === y,
        "equals": (x, y) => x === y,
        "<=": (x, y) => x <= y,
        ">=": (x, y) => x >= y
      };

      const fn = ops[rawOp];
      if (!fn) throw httpError(400, `Unsupported number operator: ${rawOp}`);
      const ok = fn(a, b);
      return { result: ok, reason: ok ? `Match: ${a} ${rawOp} ${b}` : `No match: ${a} ${rawOp} ${b} is false`, matchingData };
    }

    // --- DATE LOGIC (Refined for trigger accuracy) ---
    if (columnType === "date") {
      const aStr = parseDateString(actual);
      const bStr = parseDateString(expected);

      if (!aStr || !bStr) {
        return { result: false, reason: `Invalid date format. Expected YYYY-MM-DD. Got: ${actual}`, matchingData };
      }

      const ops = {
        "before": (x, y) => x < y,
        "after": (x, y) => x > y,
        "=": (x, y) => x === y,
        "equals": (x, y) => x === y,
      };

      const fn = ops[rawOp];
      if (!fn) throw httpError(400, `Unsupported date operator: ${rawOp}`);
      
      const ok = fn(aStr, bStr);
      return { result: ok, reason: ok ? `Date match: ${aStr} is ${rawOp} ${bStr}` : `Date mismatch: ${aStr} vs ${bStr}`, matchingData };
    }

    // --- STRING LOGIC ---
    const s = String(actual || "").trim();
    const t = String(expected || "").trim();

    const ops = {
      "=": (x, y) => x.toLowerCase() === y.toLowerCase(),
      "equals": (x, y) => x.toLowerCase() === y.toLowerCase(),
      "contains": (x, y) => x.toLowerCase().includes(y.toLowerCase()),
      "startswith": (x, y) => x.toLowerCase().startsWith(y.toLowerCase()),
      "empty": (x) => x.length === 0,
      "filled": (x) => x.length > 0,
    };

    if (!ops[rawOp]) throw httpError(400, `Unsupported string operator: ${rawOp}`);

    const ok = (rawOp === "empty" || rawOp === "filled") ? ops[rawOp](s) : ops[rawOp](s, t);
    return { result: ok, reason: ok ? "String condition met." : "String condition failed.", matchingData };
  }
}

module.exports = { RuleEngine, classifyColumnType };