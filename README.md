# Support Ticketing Tool

## Overview
A production-ready client-facing support ticketing platform built with React, Express, and MySQL. The application supports clients, agents, and admins with role-based access control, ticket lifecycle management, internal notes, and SLA handling.

## Features
- Secure authentication with JWT and bcrypt
- Role-based access control for clients, agents, and admins
- Ticket creation, replies, internal notes, status updates, and assignment
- SLA-based due dates and overdue tracking
- Responsive dashboard UI with filtering, search, pagination, and status badges
- MySQL-backed persistence with normalized schema

## Folder Structure
- backend/ – Express API, middleware, routes, services, validations, and schema
- frontend/ – React/Vite client application

## Installation
### Backend
1. cd backend
2. npm install
3. Create a MySQL database and import schema.sql
4. Copy .env.example to .env and update values
5. npm run dev

### Frontend
1. cd frontend
2. npm install
3. npm run dev

## Environment Variables
See backend/.env.example for the required configuration.

## Database Setup
Run the SQL script:
```bash
mysql -u root -p < backend/schema.sql
```

## Running Backend
```bash
cd backend
npm run dev
```

## Running Frontend
```bash
cd frontend
npm run dev
```

## API Endpoints
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/tickets
- POST /api/tickets
- GET /api/tickets/:id
- POST /api/tickets/:id/reply
- POST /api/tickets/:id/internal-note
- PATCH /api/tickets/:id/status
- PATCH /api/tickets/:id/assign
- GET /api/admin/users
- POST /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- GET /api/admin/clients
- POST /api/admin/clients
- PUT /api/admin/clients/:id
- DELETE /api/admin/clients/:id

## Screenshots
Placeholders coming soon.

## Future Improvements
- Add email notifications
- Add file attachments
- Add audit logs and analytics
- Add unit and integration tests
