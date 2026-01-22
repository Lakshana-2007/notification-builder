## Notification Rule Builder (React + Express + MySQL)

### Folder structure
- `backend/`: Express API (schema discovery + rules + RuleEngine + logs)
- `frontend/`: React UI (Dashboard, RuleBuilder, TestLab, Logs timeline)
- `sql/`: MySQL init + seed scripts for `doctor_db` and `patient_db`

### Prerequisites
- Node.js 18+ (recommended)
- MySQL 8+

### 1) Initialize databases

Run:
- `sql/01_doctor_db_init.sql`
- `sql/02_patient_db_init.sql`

Example:

```sql
SOURCE sql/01_doctor_db_init.sql;
SOURCE sql/02_patient_db_init.sql;
```

### 2) Backend

Create env file (example is `backend/env.example`) and set:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `FRONTEND_ORIGIN` (default `http://localhost:5173`)

Start API:

```powershell
Set-Location D:\demo-ruler\backend
npm install
npm run dev
```

API endpoints:
- `GET /api/databases`
- `GET /api/databases/:db/tables`
- `GET /api/databases/:db/tables/:table/columns`
- `GET /api/rules`
- `POST /api/rules`
- `POST /api/rules/test`
- `GET /api/rules/:id/logs`

### 3) Frontend

Optional env:
- `frontend/.env` with `VITE_API_BASE=http://localhost:4000/api`

Run:

```powershell
Set-Location D:\demo-ruler\frontend
npm install
npm run dev
```

