import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./AppHeader.module.css";
// Import the logo from your public folder or assets
import logo from "/vite.svg"; 

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          {/* Replaced 'NR' text with the logo image */}
          <div className={styles.logoContainer}>
            <img 
              src={logo} 
              alt="Notification Rule Builder Logo" 
              className={styles.logoImage} 
            />
          </div>
          <div>
            <div className={styles.title}>Notification Rule Builder</div>
            <div className={styles.subtitle}>
              Progressive Disclosure • Type-aware evaluation • Instant feedback
            </div>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? styles.navLinkActive : styles.navLink
            }
            end
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/rules/new"
            className={({ isActive }) =>
              isActive ? styles.navLinkActive : styles.navLink
            }
          >
            Build Rule
          </NavLink>
          <NavLink
            to="/test"
            className={({ isActive }) =>
              isActive ? styles.navLinkActive : styles.navLink
            }
          >
            TestLab
          </NavLink>
        </nav>
      </div>
    </header>
  );
}