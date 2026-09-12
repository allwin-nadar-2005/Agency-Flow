# PLAN.md — Real-Time Client Project Dashboard (Role-Based Access & Live Activity Feed)

## 1. Problem & Motivation
Small agencies managing multiple clients and projects lack a lightweight internal tool where **Admins, Project Managers, and Developers** each see exactly what they're allowed to see — in real time. Generic project tools (Trello, Asana) either over-expose data across roles or require heavy configuration. Agencies need:
- Strict, API-enforced role boundaries (a Developer must never see another dev's tasks, even via a modified token).
- A live feed of "who did what, when" so managers aren't refreshing pages to track progress.
- Automated overdue-flagging and notifications without manual babysitting.

This is explicitly **not a CRUD tutorial app** — the grading criteria (25% real-time feed, 25% API-level RBAC, 20% DB design, 20% architecture) mean the WebSocket + auth layers are where the score is won or lost.

## 2. Target Users & Personas
| Persona | Role | Needs |
|---|---|---|
| **Amara** | Admin | Full visibility — all clients, projects, users, global activity, live "users online" count |
| **Ravi** | Project Manager | Manage only projects *he created*, assign tasks, see his team's activity only |
| **Divya** | Developer | See only tasks assigned to her, update status, get notified on new assignments |

## 3. One-Line Product Description
A role-scoped, real-time project management dashboard where every task change streams instantly to the right eyes — and only the right eyes.

## 4. Key Use Cases / User Flows
1. **Login → Role-based redirect** → Admin sees global dashboard, PM sees "My Projects," Developer sees "My Tasks."
2. **PM creates a project → assigns tasks to developers** → developers get in-app + real-time notification.
3. **Developer moves a task To Do → In Progress → In Review** → Activity feed updates live for PM (their project) and Admin (global), without refresh.
4. **Developer goes offline, comes back** → fetches last 20 missed activity events from DB (not memory-cached).
5. **Scheduled job runs hourly** → flags overdue tasks → feed + dashboards update.
6. **Any role filters task list by status/priority/due-date** → filters reflected in shareable URL query params.

## 5. MVP Features (P0 — must ship for grading criteria)
- [ ] JWT auth: access token + **HttpOnly refresh token cookie** (not localStorage)
- [ ] Role middleware enforced on **every** protected API route (not frontend-only)
- [ ] Admin / PM / Developer data isolation verified even via direct API calls with modified tokens
- [ ] Projects + Tasks CRUD (title, description, assignee, status, priority, due date, activity log)
- [ ] Task status changes logged to DB with timestamp + actor (never derived/computed)
- [ ] PM can only manage projects they created
- [ ] **WebSocket-based live activity feed**, role-filtered (Admin global / PM own-projects / Dev own-tasks)
- [ ] Feed message format: `"{user} moved Task #{id} from {old} → {new} · {time ago}"`
- [ ] Missed-event catchup: last 20 events fetched from DB on reconnect
- [ ] node-cron scheduled job to auto-flag overdue tasks (not on page load)
- [ ] Role-specific dashboards (Admin: totals + overdue count + live online-user count via WS presence; PM: project summary + priorities + upcoming due dates; Developer: assigned tasks sorted by priority→due date)
- [ ] Filters (status/priority/due-date) via query params
- [ ] In-app notifications (assignment + "moved to In Review"), DB-stored, real-time unread count via WebSocket
- [ ] Server-side validation on all inputs; structured, consistent error responses (no raw stack traces)
- [ ] Seed script: 1 Admin, 2 PMs, 4 Devs, 3+ projects w/ 5+ tasks each, 2+ overdue, pre-existing activity logs
- [ ] `.env` for all secrets
- [ ] README: setup (Docker preferred), schema diagram, architecture justifications, known limitations

## 6. Stretch Features (P1 — only if time remains)
- [ ] Notification dropdown with mark-all-as-read
- [ ] Presence indicators (green dot) per user in project view
- [ ] Task comments/mentions
- [ ] CSV export of filtered task list
- [ ] Dark mode / polish pass on shadcn components
- [ ] Basic analytics chart (tasks completed per day)

## 7. Tech Stack & Integrations
| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React + TypeScript** | No plain JS accepted per spec |
| Styling | Tailwind + shadcn/ui | Fast, consistent components |
| Backend | **Node.js + Fastify** | Faster than Express, built-in schema validation (justify in README as: lower overhead, native JSON schema validation reduces custom validation code) |
| Database | **PostgreSQL** | Relational schema, FKs, indexes on `task.assignee_id`, `task.project_id`, `task.status`, `task.due_date` |
| ORM | **Prisma** | Type-safe queries, migrations, schema-as-code |
| Real-time | **Socket.IO** (justify over native WS in README: built-in reconnection, room-based broadcasting maps cleanly to role-scoped feeds — Admin room = global, PM room = their project IDs, Dev room = their user ID) |
| Background Jobs | **node-cron** (justify over Bull: no Redis dependency needed for a single scheduled overdue-check job — Bull would be overkill for one recurring task in 48hrs) |
| Auth | JWT access token (short-lived, in memory/header) + refresh token in HttpOnly cookie |
| Hosting | Vercel (frontend + API routes or separate backend service) |
| Repo | Public GitHub |

## 8. 48-Hour Build Plan (time-sliced milestones)
**Hours 0–4 — Setup & Schema**
- Repo scaffold, Docker Compose (Postgres), Prisma schema (User, Project, Task, ActivityLog, Notification), migrations, seed script skeleton.

**Hours 4–10 — Auth & RBAC Core**
- JWT issuance, refresh cookie flow, role middleware, protected route tests (try to break isolation manually — this is 25% of the grade).

**Hours 10–20 — Projects & Tasks CRUD**
- REST endpoints (Fastify + Prisma), server-side validation (Zod/Fastify schemas), structured error handler, ownership checks (PM → own projects only).

**Hours 20–30 — Real-Time Feed (core technical challenge)**
- Socket.IO server, room strategy per role, emit on task status change, missed-event catchup endpoint (last 20 from DB), test multi-client live updates.

**Hours 30–34 — Background Jobs & Notifications**
- node-cron overdue-flagging job, notification creation triggers (assignment, move-to-review), WS-pushed unread count.

**Hours 34–40 — Dashboards & Filters**
- Role-specific dashboard views, query-param filters, live online-user count (WS presence tracking).

**Hours 40–44 — Seed Data, README, Polish**
- Finalize seed script per spec, write README (schema diagram, architecture justifications, known limitations), fix edge cases.

**Hours 44–48 — Deploy & Pitch Prep**
- Deploy to Vercel, smoke-test live link, record/rehearse demo script, write the 150–250 word Explanation field.

## 9. Demo Script Outline (60–90 sec, what judges see)
1. **(0–15s)** Log in as PM → show "My Projects" dashboard, only their data visible.
2. **(15–35s)** Open a second browser window logged in as a Developer on that project. PM moves a task to "In Review" → **judges watch the Developer's feed update live, no refresh.**
3. **(35–55s)** Switch to Admin view → show global activity feed picking up the same event, plus live "3 users online" WebSocket presence count.
4. **(55–75s)** Show a task hitting its due date already flagged "Overdue" (seeded/triggered by cron), and the notification bell updating in real time.
5. **(75–90s)** Quick aside: attempt to hit a PM's API endpoint with a Developer's token in a terminal/Postman → show the 403 — proving API-level RBAC, not just UI hiding.

**Demo Moment:** The side-by-side live feed update across two roles simultaneously — this single moment demonstrates the WebSocket architecture, role-filtering, and DB-backed persistence all at once.
