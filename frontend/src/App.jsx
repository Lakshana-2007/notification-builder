import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import styles from "./styles/AppShell.module.css";

import { AppHeader } from "./components/Common/AppHeader/AppHeader";
import { DashboardPage } from "./pages/DashboardPage/DashboardPage";
import { RuleBuilderPage } from "./pages/RuleBuilderPage/RuleBuilderPage";
import { TestLabPage } from "./pages/TestLabPage/TestLabPage";
import { RuleLogsPage } from "./pages/RuleLogsPage/RuleLogsPage";

export function App() {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <AppHeader />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rules/new" element={<RuleBuilderPage />} />
          <Route path="/test" element={<TestLabPage />} />
          <Route path="/rules/:id/logs" element={<RuleLogsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

