import React from "react";
import styles from "./Card.module.css";

export function Card({ children, className = "" }) {
  return <section className={[styles.card, className].join(" ")}>{children}</section>;
}

export function CardHeader({ title, subtitle, actions }) {
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.title}>{title}</div>
        {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

