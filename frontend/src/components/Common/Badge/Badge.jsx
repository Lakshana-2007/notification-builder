import React from "react";
import styles from "./Badge.module.css";

export function Badge({ tone = "neutral", children }) {
  const className = [styles.badge, styles[tone]].join(" ");
  return <span className={className}>{children}</span>;
}

