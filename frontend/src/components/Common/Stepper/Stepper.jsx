import React from "react";
import styles from "./Stepper.module.css";

export function Stepper({ steps, activeIndex = 0 }) {
  return (
    <ol className={styles.stepper} aria-label="Progress">
      {steps.map((s, idx) => {
        const state =
          idx < activeIndex ? "done" : idx === activeIndex ? "active" : "todo";
        return (
          <li key={s.key} className={[styles.step, styles[state]].join(" ")}>
            <div className={styles.dot} aria-hidden="true">
              {idx < activeIndex ? "✓" : idx + 1}
            </div>
            <div>
              <div className={styles.label}>{s.label}</div>
              {s.hint ? <div className={styles.hint}>{s.hint}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

