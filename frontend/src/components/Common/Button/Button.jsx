import React from "react";
import styles from "./Button.module.css";

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}) {
  const isDisabled = disabled || isLoading;
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    isDisabled ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={className} disabled={isDisabled} {...props}>
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
}

