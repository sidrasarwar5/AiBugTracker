# Bug Tracker — Frontend (Next.js)

Connects to the Django backend you already have running. Implements every
page from the spec, role-based routing, JWT auth with auto-refresh, and
the same business rules as the backend (status options restricted by bug
type, screenshot extension checks, etc).

## 1. Install dependencies

```bash
cd frontend
npm install
```

## 2. Configure the backend URL

```bash
copy .env.local.example .env.local        # Windows
# cp .env.local.example .env.local        # Mac/Linux
```

By default it points at:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

This only needs to change if your Django server runs on a different
host/port.

## 3. Make sure the backend is reachable

Your Django backend needs to actually be running, with CORS configured to
allow this frontend's origin. In the **backend's** `.env`, confirm:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

(This is already the default in the backend's `.env.example`, so if you
haven't touched it, you're already set.)

In one terminal:
```bash
cd backend
python manage.py runserver
```

## 4. Run the frontend

In a second terminal:
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** — it will redirect you to `/login` (the
spec says `/` is not public).

## How the connection works

- `lib/api.ts` is the single place that talks to Django. Every request
  goes through `api.get/post/patch/delete`, which:
  - attaches the JWT access token from `localStorage` to the
    `Authorization` header automatically
  - if a request comes back `401` (token expired), it silently calls
    `/api/auth/login/refresh/` once and retries -- you don't see this happen
  - throws an `ApiError` with the same message DRF sent back, so error
    banners on screen show real backend validation messages (e.g. "User
    not found")
- `contexts/AuthContext.tsx` holds the logged-in user in memory and exposes
  `useAuth()` to any component.
- `components/RequireAuth.tsx` wraps every dashboard page: redirects to
  `/login` if you're not authenticated, and bounces you to your own
  dashboard if you try to visit a page meant for a different role (e.g. a
  Developer hitting `/manager/dashboard`).

## Pages built (matches the spec's page list exactly)

| Route | Role | Notes |
|---|---|---|
| `/` | -- | redirects to `/login` or your dashboard |
| `/signup` | -- | role dropdown: manager / qa / developer |
| `/login` | -- | one login for everyone, redirects by role |
| `/manager/dashboard`, `/manager/projects` | Manager | projects you created |
| `/manager/projects/create` | Manager | |
| `/manager/projects/[id]` | Manager | members list + add-member form, bugs view-only |
| `/qa/dashboard`, `/qa/projects` | QA | projects you were added to |
| `/qa/bugs/create` | QA | screenshot upload (PNG/GIF only), assign to a developer |
| `/qa/bugs/[id]` | QA | edit details, reassign to a different developer |
| `/developer/dashboard`, `/developer/bugs` | Developer | bugs assigned to you, empty state if none |
| `/developer/bugs/[id]` | Developer | update status (options restricted by bug type), resolution notes |

## Verified before delivery

- `npx tsc --noEmit` -- zero errors
- `npx eslint .` -- zero errors, zero warnings
- `npm run build` -- all 14 routes compile successfully
- Tested CORS preflight + actual login call against the real Django
  backend -- confirmed the response shape matches what the frontend expects

## Not yet built

- **Notifications UI** -- the backend has `/api/notifications/` and
  `lib/notifications.ts` already calls it, but no page/bell-icon displays
  them yet. Quick to add once you want it.
- **AI features (Phase 2)** -- per your plan, deferred until after backend +
  frontend are solid.
