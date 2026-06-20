# Bug Tracker — Backend (Django REST Framework)

Implements: Django Auth (custom `Profile` user model, email login) + JWT,
Projects, Project Members, Bugs, Notifications — exactly matching the
spec and the database design your trainer approved.

## 1. Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows:.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2. Configure environment

```bash
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
```

By default `DB_ENGINE=sqlite` — **no database server needed**. Django will
create a `db.sqlite3` file automatically when you run migrations. This is
the fastest way to get running locally.

```
SECRET_KEY=replace-with-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=sqlite

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Switching to Supabase (or any Postgres) later

When you're ready to move off SQLite, change two things in `.env` —
no code changes needed anywhere:

```
DB_ENGINE=postgres

DB_NAME=postgres
DB_USER=postgres.xxxxxxxxxxxx        # from Supabase connection string
DB_PASSWORD=your-supabase-db-password
DB_HOST=aws-0-xx-xxxx-1.pooler.supabase.com
DB_PORT=5432
```

You'll find these exact values in your Supabase project under
**Settings → Database → Connection string**. Then run `python manage.py migrate`
again — it'll create all the same tables in Supabase's Postgres.

## 3. Run migrations

Migrations are already written (`accounts/migrations/0001_initial.py`,
`projects/migrations/0001_initial.py`, `bugs/migrations/0001_initial.py`)
and were verified end-to-end before delivery — they work against both
SQLite and Postgres without changes. Just apply them:

```bash
python manage.py migrate
```

## 4. Create an admin (optional, for Django Admin panel)

```bash
python manage.py createsuperuser
```
It will ask for email, full_name, role, then password.

## 5. Run the server

```bash
python manage.py runserver
```

API base URL: `http://localhost:8000/api/`
Admin panel: `http://localhost:8000/admin/`

---

## API Reference

### Auth
| Method | Endpoint | Who | Body |
|---|---|---|---|
| POST | `/api/auth/signup/` | anyone | `{full_name, email, password, role}` |
| POST | `/api/auth/login/` | anyone | `{email, password}` → `{access, refresh, user}` |
| POST | `/api/auth/login/refresh/` | anyone | `{refresh}` → `{access}` |
| GET | `/api/auth/me/` | logged in | — |

### Projects
| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/api/projects/` | logged in | Manager: own projects. QA/Dev: assigned projects. |
| POST | `/api/projects/` | Manager | `{name, description}` |
| GET | `/api/projects/<id>/` | logged in (if visible) | |
| POST | `/api/projects/<id>/add-member/` | Manager (own project) | `{email, role}` — role must match the account's signup role |

### Bugs
| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/api/bugs/?project=<id>` | logged in | Dev: only bugs assigned to them. QA/Manager: bugs in visible projects. |
| POST | `/api/bugs/` | QA (project member) | `{title, description, type, project, deadline, screenshot, assigned_to_id}` |
| GET | `/api/bugs/<id>/` | logged in (if visible) | |
| PATCH | `/api/bugs/<id>/` | QA (who is member of that project) | edit bug details |
| POST | `/api/bugs/<id>/assign/` | QA (project member) | `{assigned_to_id}` — assign/reassign |
| PATCH | `/api/bugs/<id>/status/` | Developer (bug assigned to them) | `{status, resolution_notes}` |

### Notifications
| Method | Endpoint | Who |
|---|---|---|
| GET | `/api/notifications/` | logged in (own notifications only) |

## Business rules enforced (verified with smoke tests before delivery)

- A user can only be added to the same project once (`UniqueConstraint`).
- A Manager only ever sees projects they created; QA/Dev only see projects they were added to.
- Bug titles must be unique within a project, but the same title is allowed across different projects.
- Status values are restricted by bug type: `Bug` → new/started/resolved, `Feature` → new/started/completed.
- Screenshots only accept `.png` / `.gif`.
- A Developer can only update status on bugs assigned to them — anything else returns 404 (not 403, so as not to leak existence of bugs outside their scope).
- Adding a member by email requires an existing account; unknown emails return `"User not found"`.

## Not yet implemented (next steps per the project plan)

- **Real email sending** — currently a `Notification` row is created in the DB on every "add member" / "assign bug" event, but no actual SMTP email is sent yet. Wire up `django.core.mail` (or an email service) in `projects/views.py::AddMemberView` and `bugs/views.py` where the `Notification.objects.create(...)` calls are.
- **AI features (Phase 2)** — semantic search, bug assistant, resolution suggestions, chatbot, voice input — intentionally deferred per your plan ("Database → Backend → Frontend → AI").
- **Frontend (Next.js)** — not part of this delivery; this is backend-only as requested.

## One design decision worth confirming with your trainer

When a Manager adds a member by email, this implementation **requires the
chosen role to match the account's signup role** (e.g. you can't add
someone who signed up as a Developer and label them "QA" on a project).
This was not explicitly stated in the spec, but it prevents an account
from getting permissions in a project that don't match their actual
expertise/registration. If your trainer wants this to be more flexible
(any account can take any project role), say so and it's a one-line change
in `projects/serializers.py::AddMemberSerializer.validate`.
