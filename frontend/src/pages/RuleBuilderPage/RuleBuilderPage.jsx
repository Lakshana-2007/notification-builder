import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/apiClient";
import { Card, CardHeader } from "../../components/Common/Card/Card";
import { Stepper } from "../../components/Common/Stepper/Stepper";
import { Field } from "../../components/Common/Field/Field";
import { Select } from "../../components/Common/Select/Select";
import { Input } from "../../components/Common/Input/Input";
import { Button } from "../../components/Common/Button/Button";
import { Badge } from "../../components/Common/Badge/Badge";
import styles from "./RuleBuilderPage.module.css";

function operatorOptions(kind) {
  if (kind === "number") {
    return [
      { key: "<", label: "less than (<)" },
      { key: "<=", label: "less than or equal (<=)" },
      { key: "=", label: "equals (=)" },
      { key: ">=", label: "greater than or equal (>=)" },
      { key: ">", label: "greater than (>)" },
    ];
  }
  if (kind === "date") {
    return [
      { key: "before", label: "before" },
      { key: "after", label: "after" },
      { key: "equals", label: "equals" },
    ];
  }
  return [
    { key: "=", label: "equals (=)" },
    { key: "contains", label: "contains" },
    { key: "startsWith", label: "starts with" },
    { key: "empty", label: "is empty" },
    { key: "filled", label: "is filled" },
  ];
}

function classifyColumn(dataType) {
  const t = String(dataType || "").toLowerCase();
  if (
    t.includes("int") ||
    t.includes("decimal") ||
    t.includes("numeric") ||
    t.includes("float") ||
    t.includes("double")
  )
    return "number";
  if (t.includes("date") || t.includes("time") || t.includes("year"))
    return "date";
  return "string";
}

export function RuleBuilderPage() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [database, setDatabase] = useState("");
  const [table, setTable] = useState("");
  const [column, setColumn] = useState("");
  const [columnType, setColumnType] = useState(""); // from API: dataType
  const [operatorKey, setOperatorKey] = useState("");
  const [compareValue, setCompareValue] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState({
    dbs: false,
    tables: false,
    cols: false,
    save: false,
  });
  const [error, setError] = useState(null);

  const [databases, setDatabases] = useState([]);
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);

  const kind = useMemo(() => classifyColumn(columnType), [columnType]);
  const ops = useMemo(() => operatorOptions(kind), [kind]);

  const activeStep = useMemo(() => {
    if (!database) return 0;
    if (!table) return 1;
    if (!column) return 2;
    return 3;
  }, [database, table, column]);

  useEffect(() => {
    let alive = true;
    setLoading((s) => ({ ...s, dbs: true }));
    api
      .listDatabases()
      .then((d) => {
        if (!alive) return;
        setDatabases(d.databases || []);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading((s) => ({ ...s, dbs: false })));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!database) return;
    let alive = true;
    setLoading((s) => ({ ...s, tables: true }));
    api
      .listTables(database)
      .then((d) => {
        if (!alive) return;
        setTables(d.tables || []);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading((s) => ({ ...s, tables: false })));
    return () => {
      alive = false;
    };
  }, [database]);

  useEffect(() => {
    if (!database || !table) return;
    let alive = true;
    setLoading((s) => ({ ...s, cols: true }));
    api
      .listColumns(database, table)
      .then((d) => {
        if (!alive) return;
        setColumns(d.columns || []);
        setError(null);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading((s) => ({ ...s, cols: false })));
    return () => {
      alive = false;
    };
  }, [database, table]);

  // Reset downstream selections (progressive disclosure)
  useEffect(() => {
    setTable("");
    setColumn("");
    setColumnType("");
    setOperatorKey("");
    setCompareValue("");
    setTables([]);
    setColumns([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [database]);

  useEffect(() => {
    setColumn("");
    setColumnType("");
    setOperatorKey("");
    setCompareValue("");
    setColumns([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  useEffect(() => {
    setOperatorKey("");
    setCompareValue("");
  }, [column]);

  function onPickColumn(colName) {
    setColumn(colName);
    const meta = columns.find((c) => c.name === colName);
    setColumnType(meta?.dataType || "");
  }

  const needsCompareValue = operatorKey && !["empty", "filled"].includes(operatorKey);

  const canSave =
    name.trim().length >= 2 &&
    database &&
    table &&
    column &&
    columnType &&
    operatorKey &&
    (!needsCompareValue || String(compareValue).trim() !== "");

  async function onSave() {
    setError(null);
    setLoading((s) => ({ ...s, save: true }));
    try {
      const created = await api.createRule({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        isEnabled: enabled,
        targetDatabase: database,
        targetTable: table,
        targetColumn: column,
        targetColumnType: columnType,
        operatorKey,
        compareValue: needsCompareValue ? compareValue : null,
      });
      nav(`/rules/${created.id}/logs`);
    } catch (e) {
      setError(e);
    } finally {
      setLoading((s) => ({ ...s, save: false }));
    }
  }

  const steps = [
    { key: "db", label: "Select database", hint: "Choose a schema to explore." },
    { key: "table", label: "Select table", hint: "Narrow to a domain entity." },
    { key: "col", label: "Select column", hint: "Pick a field to evaluate." },
    { key: "logic", label: "Define logic", hint: "Set operator + value." },
  ];

  return (
    <div className={styles.wrap}>
      <Card>
        <CardHeader
          title="Build a rule"
          subtitle="Progressive disclosure guides you from schema discovery to condition logic."
          actions={
            <div className={styles.badges}>
              <Badge tone={enabled ? "good" : "neutral"}>
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          }
        />

        <Stepper steps={steps} activeIndex={activeStep} />

        {error ? (
          <div className={styles.inlineError} role="status">
            <div className={styles.inlineErrorTitle}>Action needed</div>
            <div className={styles.inlineErrorBody}>
              {String(error.message || error)}
            </div>
          </div>
        ) : null}

        <div className={styles.grid}>
          <Card className={styles.panel}>
            <div className={styles.panelTitle}>Rule identity</div>
            <div className={styles.panelBody}>
              <Field label="Rule name" id="ruleName" hint="Short, clear, and scannable.">
                <Input
                  id="ruleName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Confirmed appointments trigger notification"
                />
              </Field>

              <Field label="Description" id="ruleDesc" hint="Optional. Helps future-you understand intent.">
                <Input
                  id="ruleDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="When appointment status becomes CONFIRMED, notify care team."
                />
              </Field>

              <Field label="Status" id="ruleEnabled" hint="Disabled rules stay visible but won't be triggered.">
                <Select
                  id="ruleEnabled"
                  value={enabled ? "enabled" : "disabled"}
                  onChange={(e) => setEnabled(e.target.value === "enabled")}
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className={styles.panel}>
            <div className={styles.panelTitle}>Schema discovery</div>
            <div className={styles.panelBody}>
              <Field
                label="Database"
                id="db"
                hint="We discover available databases dynamically from INFORMATION_SCHEMA."
              >
                <Select
                  id="db"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  disabled={loading.dbs}
                >
                  <option value="">Select a database…</option>
                  {databases.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Table" id="table" hint={database ? "Select a table to continue." : "Pick a database first."}>
                <Select
                  id="table"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  disabled={!database || loading.tables}
                >
                  <option value="">Select a table…</option>
                  {tables.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Column" id="column" hint={table ? "Pick a column; we’ll tailor operators by type." : "Pick a table first."}>
                <Select
                  id="column"
                  value={column}
                  onChange={(e) => onPickColumn(e.target.value)}
                  disabled={!table || loading.cols}
                >
                  <option value="">Select a column…</option>
                  {columns.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.dataType})
                    </option>
                  ))}
                </Select>
              </Field>

              {column ? (
                <div className={styles.typePill}>
                  Type: <span className={styles.mono}>{columnType}</span> →{" "}
                  <span className={styles.kind}>{kind}</span> operators
                </div>
              ) : null}
            </div>
          </Card>

          <Card className={styles.panel}>
            <div className={styles.panelTitle}>Condition logic</div>
            <div className={styles.panelBody}>
              <Field label="Operator" id="op" hint={column ? "Choose how to evaluate the value." : "Select a column first."}>
                <Select
                  id="op"
                  value={operatorKey}
                  onChange={(e) => setOperatorKey(e.target.value)}
                  disabled={!column}
                >
                  <option value="">Select an operator…</option>
                  {ops.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Comparison value"
                id="cmp"
                hint={
                  !operatorKey
                    ? "Pick an operator first."
                    : needsCompareValue
                      ? kind === "date"
                        ? 'Use an ISO date like "2026-01-21".'
                        : "Use a value that matches the chosen type."
                      : "No value required for this operator."
                }
              >
                <Input
                  id="cmp"
                  value={compareValue}
                  onChange={(e) => setCompareValue(e.target.value)}
                  placeholder={kind === "date" ? "YYYY-MM-DD" : "value"}
                  disabled={!operatorKey || !needsCompareValue}
                />
              </Field>

              <div className={styles.preview}>
                <div className={styles.previewTitle}>Preview</div>
                <div className={styles.previewBody}>
                  <div className={styles.mono}>
                    {database && table && column
                      ? `${database}.${table}.${column}`
                      : "—"}
                    {"  "}
                    {operatorKey || "—"}
                    {needsCompareValue ? `  ${String(compareValue || "—")}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerHint}>
            Tip: after saving, go to TestLab to paste a payload and see immediate “Triggered / Not Triggered” with a “Why”.
          </div>
          <Button onClick={onSave} disabled={!canSave} isLoading={loading.save}>
            Save rule
          </Button>
        </div>
      </Card>
    </div>
  );
}

