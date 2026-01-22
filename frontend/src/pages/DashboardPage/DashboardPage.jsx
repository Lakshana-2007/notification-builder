import React from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/apiClient";
import { useAsync } from "../../hooks/useAsync";
import { Card, CardHeader } from "../../components/Common/Card/Card";
import { Button } from "../../components/Common/Button/Button";
import { Badge } from "../../components/Common/Badge/Badge";
import styles from "./DashboardPage.module.css";

function statusTone(isEnabled) {
  return isEnabled ? "good" : "neutral";
}

export function DashboardPage() {
  const rulesQuery = useAsync(() => api.listRules(), []);

  const rules = rulesQuery.data?.rules || [];

  return (
    <div className={styles.wrap}>
      <Card>
        <CardHeader
          title="Rules"
          subtitle="Scan-friendly list of notification rules. Create a new rule, then validate it in TestLab."
          actions={
            <div className={styles.actions}>
              <Link to="/test">
                <Button variant="secondary">Open TestLab</Button>
              </Link>
              <Link to="/rules/new">
                <Button>Create Rule</Button>
              </Link>
            </div>
          }
        />

        {rulesQuery.status === "loading" ? (
          <div className={styles.empty}>Loading rules…</div>
        ) : rulesQuery.status === "error" ? (
          <div className={styles.empty}>
            <div className={styles.errorTitle}>Couldn’t load rules</div>
            <div className={styles.errorBody}>
              {String(rulesQuery.error?.message || rulesQuery.error)}
            </div>
            <Button variant="secondary" onClick={rulesQuery.run}>
              Retry
            </Button>
          </div>
        ) : rules.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>No rules yet</div>
            <div className={styles.emptyBody}>
              Start with a simple condition like “appointments.status equals
              CONFIRMED”.
            </div>
            <Link to="/rules/new">
              <Button>Create your first rule</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.tableWrap} role="region" aria-label="Rules">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Condition</th>
                  <th>Logs</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className={styles.ruleName}>{r.name}</div>
                      {r.description ? (
                        <div className={styles.ruleDesc}>{r.description}</div>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone={statusTone(r.isEnabled)}>
                        {r.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td className={styles.mono}>
                      {r.targetDatabase}.{r.targetTable}.{r.targetColumn}
                    </td>
                    <td className={styles.mono}>
                      {r.operatorKey}
                      {r.operatorKey === "empty" || r.operatorKey === "filled"
                        ? ""
                        : ` ${String(r.compareValue ?? "")}`}
                    </td>
                    <td>
                      <Link to={`/rules/${r.id}/logs`}>
                        <Button variant="ghost" size="sm">
                          View timeline →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

