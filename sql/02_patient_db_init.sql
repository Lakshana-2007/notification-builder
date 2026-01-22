-- Patient DB initialization + realistic seed data
-- Usage:
--   mysql -u root -p < sql/02_patient_db_init.sql

DROP DATABASE IF EXISTS patient_db;
CREATE DATABASE patient_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE patient_db;

-- Core domain tables (required by spec)
CREATE TABLE patient_details (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_code VARCHAR(20) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  date_of_birth DATE NOT NULL,
  sex ENUM('F','M','X') NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(32) NULL,
  city VARCHAR(80) NULL,
  risk_score INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patient_code (patient_code),
  KEY idx_city (city),
  KEY idx_risk (risk_score)
);

CREATE TABLE visit_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  visit_code VARCHAR(24) NOT NULL,
  patient_id BIGINT UNSIGNED NOT NULL,
  visit_date DATE NOT NULL,
  diagnosis VARCHAR(160) NULL,
  notes TEXT NULL,
  systolic_bp INT NULL,
  diastolic_bp INT NULL,
  temperature_c DECIMAL(4,1) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visit_code (visit_code),
  KEY idx_visit_date (visit_date),
  CONSTRAINT fk_visit_patient
    FOREIGN KEY (patient_id) REFERENCES patient_details(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed patients
INSERT INTO patient_details (patient_code, full_name, date_of_birth, sex, email, phone, city, risk_score) VALUES
('PAT-2001', 'Jordan Lee', '1988-06-12', 'M', 'jordan.lee@example.test', '+1-555-0201', 'Seattle', 35),
('PAT-2002', 'Sana Khan', '1995-02-03', 'F', 'sana.khan@example.test', '+1-555-0202', 'Bellevue', 12),
('PAT-2003', 'Ethan Wright', '1972-11-19', 'M', 'ethan.wright@example.test', '+1-555-0203', 'Tacoma', 58),
('PAT-2004', 'Mina Park', '2001-09-28', 'F', 'mina.park@example.test', '+1-555-0204', 'Redmond', 8),
('PAT-2005', 'Alex Rivera', '1983-04-07', 'X', 'alex.rivera@example.test', '+1-555-0205', 'Seattle', 21);

-- Seed visit records
INSERT INTO visit_records (visit_code, patient_id, visit_date, diagnosis, notes, systolic_bp, diastolic_bp, temperature_c) VALUES
('VIS-2026-10001', 1, '2026-01-10', 'Hypertension', 'BP elevated, advised lifestyle changes.', 148, 94, 36.8),
('VIS-2026-10002', 1, '2026-01-17', 'Follow-up', 'Improving trend; continue plan.', 138, 88, 36.7),
('VIS-2026-10003', 3, '2026-01-08', 'Knee pain', 'Suspected meniscus strain; imaging ordered.', 126, 82, 36.6),
('VIS-2026-10004', 2, '2026-01-12', 'Dermatitis', 'Topical treatment prescribed.', 118, 76, 37.2),
('VIS-2026-10005', 5, '2026-01-15', 'Flu-like symptoms', 'Rest, hydration; monitor fever.', 122, 78, 38.1);

