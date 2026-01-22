

DROP DATABASE IF EXISTS doctor_db;
CREATE DATABASE doctor_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE doctor_db;

-- Core domain tables (required by spec)
CREATE TABLE doctor_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  doctor_code VARCHAR(20) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  specialty VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NULL,
  city VARCHAR(80) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctor_code (doctor_code),
  UNIQUE KEY uq_doctor_email (email),
  KEY idx_specialty (specialty),
  KEY idx_is_active (is_active)
);

CREATE TABLE appointments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  appointment_code VARCHAR(24) NOT NULL,
  doctor_id BIGINT UNSIGNED NOT NULL,
  patient_external_id VARCHAR(40) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('SCHEDULED','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
  reason VARCHAR(240) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_appointment_code (appointment_code),
  KEY idx_appt_date (appointment_date),
  KEY idx_status (status),
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Rule system persistence (production-friendly; kept in doctor_db to avoid introducing a third DB)
CREATE TABLE notification_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL,
  description VARCHAR(400) NULL,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  -- discovered target (never hardcode in UI; user selects from discovery APIs)
  target_database VARCHAR(64) NOT NULL,
  target_table VARCHAR(64) NOT NULL,
  target_column VARCHAR(64) NOT NULL,
  target_column_type VARCHAR(64) NOT NULL,
  operator_key VARCHAR(32) NOT NULL,
  compare_value TEXT NULL,
  -- JSON versioned payload (so future rule types can expand without schema changes)
  rule_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_enabled (is_enabled),
  KEY idx_target (target_database, target_table, target_column)
);

CREATE TABLE rule_execution_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rule_id BIGINT UNSIGNED NOT NULL,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  input_payload JSON NOT NULL,
  result TINYINT(1) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  matching_data JSON NULL,
  condition_snapshot JSON NOT NULL,
  PRIMARY KEY (id),
  KEY idx_rule_executed_at (rule_id, executed_at),
  CONSTRAINT fk_rule_logs_rule
    FOREIGN KEY (rule_id) REFERENCES notification_rules(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed doctors
INSERT INTO doctor_profiles (doctor_code, full_name, specialty, email, phone, city, is_active) VALUES
('DOC-1001', 'Dr. Aisha Mehra', 'Cardiology', 'aisha.mehra@northlake.example', '+1-555-0141', 'Seattle', 1),
('DOC-1002', 'Dr. Miguel Santos', 'Orthopedics', 'miguel.santos@northlake.example', '+1-555-0142', 'Tacoma', 1),
('DOC-1003', 'Dr. Priya Nair', 'Dermatology', 'priya.nair@northlake.example', '+1-555-0143', 'Bellevue', 1),
('DOC-1004', 'Dr. Evan Chen', 'Family Medicine', 'evan.chen@northlake.example', '+1-555-0144', 'Redmond', 1),
('DOC-1005', 'Dr. Noor Al-Farsi', 'Neurology', 'noor.alfarsi@northlake.example', '+1-555-0145', 'Seattle', 0);

-- Seed appointments (varied statuses/dates for rule testing)
INSERT INTO appointments (appointment_code, doctor_id, patient_external_id, appointment_date, appointment_time, status, reason) VALUES
('APT-2026-00001', 1, 'PAT-2001', '2026-01-22', '09:00:00', 'CONFIRMED', 'Chest tightness follow-up'),
('APT-2026-00002', 1, 'PAT-2002', '2026-01-22', '10:30:00', 'SCHEDULED', 'Initial consult'),
('APT-2026-00003', 2, 'PAT-2003', '2026-01-23', '13:15:00', 'CANCELLED', 'Knee pain evaluation'),
('APT-2026-00004', 4, 'PAT-2004', '2026-01-24', '11:45:00', 'COMPLETED', 'Annual physical'),
('APT-2026-00005', 3, 'PAT-2005', '2026-01-24', '15:00:00', 'NO_SHOW', 'Rash assessment');

