import React from "react";
import styles from "./Field.module.css";

export function Field({ label, hint, error, children, id }) {
  return (
    <div className={styles.field}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className={styles.control}>{children}</div>
      {error ? <div className={styles.error}>{error}</div> : null}
      {!error && hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}

