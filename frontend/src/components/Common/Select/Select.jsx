import React from "react";
import styles from "./Select.module.css";

export function Select({ id, children, ...props }) {
  return (
    <div className={styles.wrap}>
      <select id={id} className={styles.select} {...props}>
        {children}
      </select>
      <span className={styles.chev} aria-hidden="true">
        ▾
      </span>
    </div>
  );
}

