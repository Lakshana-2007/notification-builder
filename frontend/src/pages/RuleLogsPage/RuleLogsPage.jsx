import React from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../services/apiClient";
import { useAsync } from "../../hooks/useAsync";
import { Card, CardHeader } from "../../components/Common/Card/Card";
import { Button } from "../../components/Common/Button/Button";
import { Badge } from "../../components/Common/Badge/Badge";
import styles from "./RuleLogsPage.module.css";

function toneForResult(result) {
  return result ? "good" : "bad";
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

export function RuleLogsPage() {
  const { id } = useParams();
  const logsQuery = useAsync(() => api.listRuleLogs(id, 50), [id]);

  const logs = logsQuery.data?.logs || [];

  return (
    <div className={styles.wrap}>
      <Card>
        <CardHeader
          title="Rule execution timeline"
          subtitle="Each entry captures the rule’s condition snapshot, the evaluation outcome, and the matching data."
          actions={
            <div className={styles.actions}>
              <Link to="/test">
                <Button variant="secondary">Test in TestLab</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost">Back to Dashboard</Button>
              </Link>
            </div>
          }
        />

        {logsQuery.status === "loading" ? (
          <div className={styles.empty}>Loading logs…</div>
        ) : logsQuery.status === "error" ? (
          <div className={styles.empty}>
            <div className={styles.errorTitle}>Couldn’t load logs</div>
            <div className={styles.errorBody}>
              {String(logsQuery.error?.message || logsQuery.error)}
            </div>
            <Button variant="secondary" onClick={logsQuery.run}>
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>No executions yet</div>
            <div className={styles.emptyBody}>
              Go to TestLab and click “Save snapshot to logs” to create timeline
              entries.
            </div>
            <Link to="/test">
              <Button>Open TestLab</Button>
            </Link>
          </div>
        ) : (
          <ol className={styles.timeline} aria-label="Execution timeline">
            {logs.map((l) => (
              <li key={l.id} className={styles.item}>
                <div className={styles.marker} aria-hidden="true" />
                <div className={styles.card}>
                  <div className={styles.rowTop}>
                    <div className={styles.when}>
                      {formatTime(l.executedAt)}
                    </div>
                    <Badge tone={toneForResult(l.result)}>
                      {l.result ? "Triggered" : "Not Triggered"}
                    </Badge>
                  </div>

                  <div className={styles.reason}>{l.reason}</div>

                  <details className={styles.details}>
                    <summary className={styles.summary}>
                      View condition snapshot + matching data
                    </summary>
                    <div className={styles.detailsGrid}>
                      <div>
                        <div className={styles.detailsTitle}>Condition snapshot</div>
                        <pre className={styles.pre}>
{JSON.stringify(l.conditionSnapshot, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className={styles.detailsTitle}>Matching data</div>
                        <pre className={styles.pre}>
{JSON.stringify(l.matchingData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

