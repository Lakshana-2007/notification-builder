import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../services/apiClient";
import { useAsync } from "../../hooks/useAsync";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { Card, CardHeader } from "../../components/Common/Card/Card";
import { Field } from "../../components/Common/Field/Field";
import { Select } from "../../components/Common/Select/Select";
import { Button } from "../../components/Common/Button/Button";
import { Badge } from "../../components/Common/Badge/Badge";
import styles from "./TestLabPage.module.css";

/**
 * Generates a JSON template based on the rule schema.
 * Pre-fills the target value to ensure immediate triggers.
 */
const generateTemplate = (rule) => {
  if (!rule) return "{}";
  const type = String(rule.targetColumnType || "").toLowerCase();
  let value = rule.compareValue;

  if (value === null || value === undefined || value === "") {
    if (type.includes("int") || type.includes("decimal") || type.includes("number")) value = 0;
    else if (type.includes("date") || type.includes("time")) value = new Date().toISOString().split('T')[0];
    else if (type.includes("bool")) value = true;
    else value = "sample_value";
  }

  const template = {
    [rule.targetDatabase]: {
      [rule.targetTable]: {
        [rule.targetColumn]: value
      }
    }
  };
  return JSON.stringify(template, null, 2);
};

function safeJsonParse(text) {
  try {
    const obj = JSON.parse(text);
    return { ok: true, value: obj, error: null };
  } catch (e) {
    return { ok: false, value: null, error: e };
  }
}

export function TestLabPage() {
  const rulesQuery = useAsync(() => api.listRules(), []);
  const rules = rulesQuery.data?.rules || [];

  const [selectedRuleId, setSelectedRuleId] = useState("");
  const selectedRule = useMemo(
    () => rules.find((r) => String(r.id) === String(selectedRuleId)),
    [rules, selectedRuleId]
  );

  const [payloadText, setPayloadText] = useState("{}");
  const debouncedPayloadText = useDebouncedValue(payloadText, 400);
  const parsed = useMemo(() => safeJsonParse(debouncedPayloadText), [debouncedPayloadText]);

  const [outcome, setOutcome] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (selectedRule) {
      setPayloadText(generateTemplate(selectedRule));
      setOutcome(null);
      setLocalError(null);
    }
  }, [selectedRuleId, selectedRule]);

  // Real-time evaluation effect
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!selectedRule || !parsed.ok) {
        setOutcome(null);
        return;
      }

      setEvaluating(true);
      setLocalError(null);
      try {
        const res = await api.testRule({
          rule: selectedRule,
          payload: parsed.value,
          saveLog: false, // Don't save logs on every keystroke
          ruleId: selectedRule.id ? Number(selectedRule.id) : null
        });

        if (!alive) return;
        setOutcome(res);
      } catch (e) {
        if (!alive) return;
        setLocalError(e.message || "Evaluation error");
        setOutcome(null);
      } finally {
        if (alive) setEvaluating(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [selectedRule, parsed.ok, parsed.value]);

  /**
   * ARCHIVE LOGS LOGIC
   * Captures the current payload and result and saves it to the database logs.
   */
  async function saveSnapshotToLogs() {
    if (!selectedRule || !selectedRule.id) {
      setLocalError("Please select a valid rule first.");
      return;
    }

    const nowParsed = safeJsonParse(payloadText);
    if (!nowParsed.ok) {
      setLocalError("Fix JSON syntax before archiving.");
      return;
    }

    setEvaluating(true);
    setLocalError(null);

    try {
      const res = await api.testRule({
        rule: selectedRule,
        payload: nowParsed.value,
        saveLog: true, // Tell backend to insert into rule_execution_logs
        ruleId: Number(selectedRule.id), // Ensure it's a number to satisfy Zod
      });
      
      setOutcome(res);
      alert("Execution log archived successfully!");
    } catch (e) {
      setLocalError(e.message || "Failed to save log.");
    } finally {
      setEvaluating(false);
    }
  }

  const jsonError = !parsed.ok ? `Check JSON Syntax` : null;

  return (
    <div className={styles.wrap}>
      <Card>
        <CardHeader
          title="TestLab"
          subtitle="Define logic and instantly see matching rows from your live database."
          actions={
            <Button
              variant="secondary"
              onClick={saveSnapshotToLogs}
              disabled={!selectedRule || !!jsonError || evaluating}
              isLoading={evaluating}
            >
              Archive Snapshot
            </Button>
          }
        />

        <div className={styles.topRow}>
          <Field label="Active Strategy" id="rule">
            <Select
              id="rule"
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
            >
              <option value="">Select a strategy…</option>
              {rules.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>

          <div className={styles.statusBox}>
            <div className={styles.statusTitle}>Evaluation Insight</div>
            <div className={styles.statusBody}>
              {evaluating ? (
                <Badge tone="neutral">Processing...</Badge>
              ) : outcome ? (
                <>
                  <Badge tone={outcome.result ? "good" : "bad"}>
                    {outcome.result ? "TRIGGERED" : "REJECTED"}
                  </Badge>
                  <div className={styles.why}>{outcome.reason}</div>
                </>
              ) : localError ? (
                <Badge tone="bad">Error: {localError}</Badge>
              ) : (
                <Badge tone="neutral">Waiting for Input</Badge>
              )}
            </div>
          </div>
        </div>

        <div className={styles.stackedLayout}>
          <div className={styles.editorPane}>
            <div className={styles.paneTitle}>Payload Editor (JSON)</div>
            <textarea
              className={styles.editor}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            {jsonError && <div className={styles.jsonError}>{jsonError}</div>}
          </div>

          <div className={styles.timelinePane}>
            <div className={styles.paneTitle}>Live Database Matches</div>
            <div className={styles.snapshot}>
              {selectedRule ? (
                <>
                  {outcome?.result === true ? (
                    <div className={styles.liveMatchesContainer}>
                      <div className={styles.matchBadgeRow}>
                        <Badge tone="good">{outcome.liveMatches?.length || 0} Matches in MySQL</Badge>
                      </div>
                      
                      {outcome.liveMatches && outcome.liveMatches.length > 0 ? (
                        <div className={styles.tableWrapper}>
                          <table className={styles.liveTable}>
                            <thead>
                              <tr>
                                {Object.keys(outcome.liveMatches[0]).map((key) => (
                                  <th key={key} className={styles.tableHeader}>{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {outcome.liveMatches.map((row, i) => (
                                <tr key={i} className={styles.tableRow}>
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className={styles.tableCell}>
                                      {val === null ? "NULL" : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className={styles.noData}>
                          Logic passed on JSON, but no records exist in the database for this condition.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptySnap}>
                      {evaluating ? "Querying database..." : "Logic not triggered. Adjust mock payload to fetch database rows."}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.emptySnap}>Select a strategy to begin.</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}