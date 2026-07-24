# Client-Facing Support Ticketing Tool

Internal support ticketing tool for our agency. Clients submit and track tickets through a portal; agents work the tickets; admins oversee everything.

This is a real internal tool we intend to use — build it like you would for a real client.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Required Flows](#required-flows)
- [Key Requirements](#key-requirements)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone](#1-clone)
  - [2. Database Setup](#2-database-setup)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend Setup](#4-frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Overview](#api-overview)
- [Engineering Standards](#engineering-standards)
- [Process & Delivery](#process--delivery)

---

## Tech Stack

| Layer      | Technology            |
| ---------- | --------------------- |
| Frontend   | React                 |
| Backend    | Node.js (Express)     |
| Database   | MySQL                 |
| Auth       | JWT                   |

---

## Roles & Permissions

| Role       | Can do                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| **Client** | Submit tickets, view their own organization's tickets, add replies. **Cannot** see internal notes or other clients' tickets. |
| **Agent**  | View tickets assigned to them **plus** unassigned tickets, reply to clients, add internal notes, change ticket status. |
| **Admin**  | See everything. Manage users and clients, assign/reassign tickets.                                            |

---

## Required Flows

- **Auth** — Signup / login with JWT-based auth and role-based access control (RBAC).
- **Client** — Create a ticket, view their own tickets, add replies.
- **Agent** — View assigned + unassigned tickets, update status, reply, add internal notes.
- **Admin** — View all tickets, assign/reassign tickets, manage users.

---

## Key Requirements

**Data visibility (enforce server-side, always):**
- A client must **only ever** see their own organization's tickets — never another client's.
- An agent sees only tickets **assigned to them**, plus **unassigned** tickets.

**Internal notes:**
- Comments marked `isInternal` are staff-only and must **never** appear anywhere in the client's view — filter them out in the query/service layer, not just the UI.

**SLA due dates:**
- Due date calculated from priority:

  | Priority | SLA        |
  | -------- | ---------- |
  | Urgent   | 4 hours    |
  | High     | 1 day      |
  | Medium   | 3 days     |
  | Low      | 1 week     |

- Show an **"overdue"** indicator when `now > due_date` and ticket is not resolved.
- Store all timestamps in **UTC**; convert to the user's local time zone only at display time.

---

## Project Structure

```
client_ticketing_tool/
├── backend/          # Node.js + Express API  (see backend/.gitignore)
├── frontend/         # React app             (see frontend/.gitignore)
├── sql/              # Migrations / schema
└── README.md
```

Suggested backend layering (**routes → controllers → services → data access**):

```
backend/
├── src/
│   ├── config/          # db pool, env loading
│   ├── middleware/      # authenticate, authorize, error handler, rate limiter
│   ├── routes/          # route definitions only
│   ├── controllers/     # request/response handling
│   ├── services/        # business logic (SLA calc, scoping rules)
│   ├── data/            # DB access (parameterized queries)
│   ├── validators/      # joi/zod schemas
│   └── app.js
├── migrations/
├── .env.example
└── package.json
```

Suggested frontend layering:

```
frontend/
├── src/
│   ├── services/api.js  # single axios instance + interceptors
│   ├── components/      # reusable: Table, Modal, StatusBadge, FormInput
│   ├── pages/           # container components (data fetching)
│   ├── hooks/
│   └── App.jsx
├── .env.example
└── package.json
```

---

## Prerequisites

- **Node.js** ≥ 18 and npm
- **MySQL** ≥ 8
- **git**

---

## Getting Started

### 1. Clone

```bash
git clone <repo-url>
cd client_ticketing_tool
```

### 2. Database Setup

Create the database and run migrations:

```bash
mysql -u root -p -e "CREATE DATABASE ticketing;"
# then run migrations from backend (see backend README/scripts), e.g.
cd backend
npm run migrate
```

> Schema changes go through **migrations** in `sql/` or `backend/migrations/` — never edit the schema by hand.

### 3. Backend Setup

```bash
cd backend
cp .env.example .env      # then fill in real values
npm install
npm run dev               # starts Express on PORT from .env
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env      # set the API base URL
npm install
npm run dev               # starts React dev server
```

---

## Environment Variables

**`backend/.env`** (never commit — already in `.gitignore`):

```ini
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ticketing

JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1h
```

**`frontend/.env`** (never hardcode the API URL in code):

```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

> Commit a `.env.example` in each of `backend/` and `frontend/` with **placeholder** values so setup is repeatable. Never commit the real `.env`.

---

## Running the App

| Command                    | Where       | Does                              |
| -------------------------- | ----------- | --------------------------------- |
| `npm run dev`              | `backend/`  | Start API in watch mode           |
| `npm run migrate`          | `backend/`  | Apply DB migrations               |
| `npm run dev`              | `frontend/` | Start React dev server            |
| `npm run build`            | `frontend/` | Production build                  |

Open the frontend dev-server URL (printed on start) in the browser. Sign up, then log in.

---

## API Overview

Base URL: `http://localhost:5000/api`. All responses use a consistent envelope:

```json
{ "success": true, "data": { }, "error": null }
```

| Method | Endpoint                     | Role         | Purpose                          |
| ------ | ---------------------------- | ------------ | -------------------------------- |
| POST   | `/auth/signup`               | Public       | Register                         |
| POST   | `/auth/login`                | Public       | Login → JWT (rate-limited)       |
| GET    | `/tickets`                   | All (scoped) | List tickets (scoped by role)    |
| POST   | `/tickets`                   | Client       | Create ticket                    |
| GET    | `/tickets/:id`               | All (scoped) | Ticket detail                    |
| PATCH  | `/tickets/:id/status`        | Agent, Admin | Update status                    |
| PATCH  | `/tickets/:id/assign`        | Admin        | Assign / reassign                |
| GET    | `/tickets/:id/comments`      | All (scoped) | Replies (+ internal for staff)   |
| POST   | `/tickets/:id/comments`      | All (scoped) | Add reply / internal note        |
| GET    | `/users`                     | Admin        | Manage users                     |

> Endpoint list is a guide — finalize as you build. Every data route **must** enforce role scoping server-side.

---

## Engineering Standards

These are requirements, not suggestions. Reviews check for them.

### Frontend (React)

- Centralize **all** API calls in one module (`services/api.js`) using a single axios instance with `baseURL` + a request interceptor that attaches the JWT. Never call `fetch`/`axios` directly in components.
- Add a **response interceptor** to handle `401` globally (redirect to login on token expiry).
- Prefer JWT in memory or an httpOnly cookie. If using `localStorage`, understand the XSS risk.
- Build **reusable components** (`<Table>` with sort/pagination, `<Modal>`, `<StatusBadge>`, `<FormInput>`). Writing similar JSX a third time → make it a component.
- Keep components small; separate **container** (data-fetching) from **presentational** (UI) components.
- API base URLs come from **`.env`** — never hardcode `http://localhost:5000`.
- Handle **loading, empty, and error** states explicitly on every fetching screen.
- Client-side validation is UX only — the backend still validates everything.
- **Debounce** search/filter inputs that hit the API.
- **No business logic in the frontend** (SLA calc, permission checks live on the backend; the UI just displays what the API returns).
- Naming: `camelCase` for variables/functions, `PascalCase` for components.
- The frontend must **never** know the JWT secret.

### Backend (Node.js / Express)

- Auth is **middleware**, applied per-route/router — never inline auth copy-pasted into controllers.
  - `authenticate` — verify JWT, attach `req.user`.
  - `authorize(...roles)` — check `req.user.role` against allowed roles.
- Every data route enforces scoping server-side (e.g. `WHERE client_id = ?` with `req.user.clientId`). Never trust the frontend to ask nicely.
- **Parameterized queries / prepared statements only.** Never string-concatenate user input into SQL. Non-negotiable.
- Hash passwords with **bcrypt** (salt rounds 10–12). No plaintext, no reversible encryption.
- **Validate and sanitize** every request body (joi / zod / express-validator) before touching the DB.
- **Centralized error handling** — one error-handling middleware, not scattered try/catch.
- Consistent response shape: `{ success, data, error }`.
- **Never** leak internal error details (stack traces, SQL errors) to clients — log server-side, return a generic message.
- JWT secret + DB creds in **`.env`**, never committed. `.env` is in `.gitignore`.
- Reasonable JWT expiry.
- **Rate-limit** sensitive endpoints (login) against brute force.
- Layered code: **routes → controllers → services → data access.** No DB queries in route handlers.
- Log meaningfully (method, path, user, timestamp) — **never** log passwords or tokens.

### Database (MySQL)

- Every table has a **primary key** (auto-increment int or UUID).
- **Foreign keys** enforce referential integrity (`tickets.client_id → clients.id`, `tickets.assigned_agent_id → users.id`).
- **Indexes** on frequently filtered/joined columns (`tickets.client_id`, `tickets.assigned_agent_id`, `tickets.status`, `comments.ticket_id`).
- **Appropriate data types** — don't store dates/numbers as strings; size columns to what they hold; don't default everything to `VARCHAR(255)`.
- All timestamps in **UTC**; convert to local time at display only.
- **`NOT NULL`** wherever a field is genuinely required.
- **`ENUM`** for fixed sets (`status`, `priority`) — not free-text that drifts (`Open`/`open`/`OPEN`).
- `created_at` / `updated_at` on **every** table.
- **Normalize** — don't duplicate data (join to `clients`, don't store client name on every ticket row).
- Deliberate cascading behavior — choose `RESTRICT` / `SET NULL` / `CASCADE` intentionally for user/ticket/comment deletion.
- Schema changes via **migrations**, never manual edits.

---

## Process & Delivery

- **Commit as you go** — clear, incremental commits.
- If anything is ambiguous, **ask** — don't guess, don't sit on a blocker.
- Submit via a **GitHub repo link** with this README kept up to date on how to run locally.
