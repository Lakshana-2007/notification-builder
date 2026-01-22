## SQL setup

### Databases
- `doctor_db`: domain tables (`doctor_profiles`, `appointments`) + rule persistence (`notification_rules`, `rule_execution_logs`)
- `patient_db`: domain tables (`patient_details`, `visit_records`)

### Run (local MySQL)

```sql
SOURCE sql/01_doctor_db_init.sql;
SOURCE sql/02_patient_db_init.sql;
```

