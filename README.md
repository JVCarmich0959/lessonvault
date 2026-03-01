# LessonVault (v3 scaffold)

Adds working CRUD endpoints for:
- Standards Sets + Standards
- Materials
- Lesson Runs + Reflections
- LessonPlan ↔ Standards + Materials linking

Also adds minimal Next.js pages to exercise these endpoints.

## Quick start (Docker)
```bash
docker compose up --build
```
- Web: http://localhost:3000
- API docs: http://localhost:8000/docs

## Quick start (local dev)
### Backend
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

## Notes
- Auth is JWT access token stored in localStorage (simple dev scaffold).
- Workspace is auto-created on first authenticated request.
- Passwords longer than 72 bytes are rejected (bcrypt limitation).
- If you want production-hardening (refresh tokens, secure cookies, RBAC, rate limiting), do that before real users.
