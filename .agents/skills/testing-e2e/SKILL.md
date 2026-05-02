# E2E Testing - Property Management App

## Environment Setup

### Prerequisites
- PostgreSQL running on localhost:5432
- Python 3.x with venv at `backend/.venv`
- Node.js with npm for frontend

### Start Services

```bash
# 1. Start PostgreSQL
sudo service postgresql start

# 2. Start backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 3. Start frontend
cd frontend
npm run dev &
```

### Database Setup (if needed)

```bash
cd backend
source .venv/bin/activate

# Set PostgreSQL password if peer auth fails
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Run migrations and seed
alembic upgrade head
python -m scripts.seed
```

## Devin Secrets Needed
- No external secrets required. All credentials are local dev defaults.

## Test Credentials
- **URL**: http://localhost:3000
- **Email**: `admin@sample-realty.example.com`
- **Password**: `password123`
- **Tenant**: sample-realty (tenant_id=1)
- **Role**: admin (full access)

## Seed Data Inventory
| Resource | Count |
|----------|-------|
| Properties | 8 |
| Customers | 5 |
| Employees | 5 |
| Departments | 4 |
| Partners | 4 |
| Accounts | 36 |
| Documents | 6 |
| Deals | 0 |
| Journal Entries | 0 |
| KPI Targets | 0 |

## Known Issues to Watch For

### Enum Case Sensitivity
Backend SQLAlchemy models use lowercase enum values (e.g., `mansion`, `available`, `active`). Frontend code might use UPPERCASE values in label maps and form options. If enum labels show raw English instead of Japanese, or if CRUD create/edit operations fail with 422 errors, this is likely an enum case mismatch.

**Fix**: Ensure frontend label map keys and form option values match the backend's lowercase enum values.

### Dashboard KPI Endpoint
The `/api/v1/kpi/dashboard` endpoint requires a `period_start` query parameter. If the frontend doesn't pass it, the request will silently fail (caught by `.catch()`) and KPI values will show as ¥0/0%.

### bcrypt Version Compatibility
The backend uses passlib with bcrypt. bcrypt >= 5.x may have compatibility issues with passlib. Pin to `bcrypt==4.0.1` if password verification fails.

### JWT Sub Claim Type
The JWT `sub` claim must be a string. If it's stored as an integer, token decode will fail. Ensure `str(employee.id)` is used when creating the JWT.

## Testing Workflow

1. **Login**: Navigate to localhost:3000, verify redirect to /login, enter credentials
2. **Dashboard**: Verify KPI cards render (property count should match seed data)
3. **Each Management Screen**: Navigate via sidebar, verify:
   - Data loads from API (correct count matches seed data)
   - Enum labels display in Japanese (not raw English)
   - CRUD modals open with correct form fields
   - Create/edit operations succeed (no 422 errors)
   - Delete operations work with confirmation
4. **Logout**: Click logout button, verify redirect to /login

## API Endpoints Reference
- Backend health: `GET http://localhost:8000/health`
- Auth login: `POST http://localhost:8000/api/v1/auth/login` (JSON body)
- All resource endpoints require `Authorization: Bearer <token>` and `X-Tenant-Id: <id>` headers

## Tips
- The StatusBadge component handles status display separately from the label maps, so status columns (like 空室/有効) might display correctly even when type/role labels don't.
- Session persists across page reloads (JWT stored in cookie). After system restart, you may still be logged in.
- When testing CRUD, always verify the backend logs for 422 errors - the frontend might silently catch them.
- Filter dropdowns on the documents page send UPPERCASE values as query params. The backend may handle these case-insensitively for query params but strictly for POST/PUT body fields.
