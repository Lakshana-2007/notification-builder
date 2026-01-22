/**
 * API Service Layer
 * Optimized with Luke Wroblewski's principle of "Defensive Design":
 * We normalize data before sending to ensure the server never receives 
 * unexpected types (like 1/0 instead of true/false).
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // Check if the error is a validation array (the Zod error you saw)
    const message = Array.isArray(data) 
      ? `Validation Error: ${data[0].path.join('.')} ${data[0].message}`
      : data?.error?.message || `Request failed (${res.status})`;
      
    const err = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * Normalization Utility
 * Ensures backend-specific strict types (like Boolean) are respected.
 */
const normalizeRule = (rule) => ({
  ...rule,
  // Explicitly cast to Boolean to satisfy Zod/Strict validators
  isEnabled: typeof rule.isEnabled === 'undefined' ? true : Boolean(rule.isEnabled),
  // Ensure numeric fields are actually numbers if they came from a string input
  value: (rule.fieldType === 'Number' && !isNaN(rule.value)) ? Number(rule.value) : rule.value
});

export const api = {
  // Discovery Endpoints
  listDatabases: () => request("/databases"),
  
  listTables: (db) => 
    request(`/databases/${encodeURIComponent(db)}/tables`),
    
  listColumns: (db, table) =>
    request(
      `/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/columns`
    ),

  // Rule Management
  listRules: () => request("/rules"),
  
  createRule: (rule) => {
    // Normalize data before sending to prevent the "received number" error
    const cleanedRule = normalizeRule(rule);
    return request("/rules", { 
      method: "POST", 
      body: JSON.stringify(cleanedRule) 
    });
  },

  // Testing & Evaluation
  testRule: ({ rule, payload, saveLog = false, ruleId }) => {
    // Normalize the rule part of the test payload
    const cleanedRule = rule ? normalizeRule(rule) : null;
    return request("/rules/test", {
      method: "POST",
      body: JSON.stringify({ 
        rule: cleanedRule, 
        payload, 
        saveLog: Boolean(saveLog), 
        ruleId 
      }),
    });
  },

  // Logs & History
  listRuleLogs: (id, limit = 50) =>
    request(`/rules/${encodeURIComponent(id)}/logs?limit=${limit}`),
};