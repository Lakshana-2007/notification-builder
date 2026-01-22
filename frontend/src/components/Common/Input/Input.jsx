import React from "react";
import styles from "./Input.module.css";

export function Input({ id, ...props }) {
  return <input id={id} className={styles.input} {...props} />;
}

