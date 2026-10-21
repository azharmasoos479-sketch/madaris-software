# Madaris Software REST API

Base URL: `http://localhost:8080/api` — all bodies are JSON.

## Auth (demo)

```
POST /api/login
{ "email": "admin@school.pk", "password": "admin123" }
→ 200 { "token": "demo-…", "user": { "email": "…", "role": "admin" } }
```

## Whole database (used to sync the front-end)

```
GET /api/db        → the full database object
PUT /api/db        → replace the full database object
```

## Collections

`students`, `staff`, `challans`, `exams`, `ledger`, `leads`, `announcements`, `behaviour`, `payroll`

```
GET    /api/:collection          list all
GET    /api/:collection/:id      one item
POST   /api/:collection          create (id auto-generated if omitted)
PUT    /api/:collection/:id      update (partial)
DELETE /api/:collection/:id      delete
```

## Attendance

```
GET /api/attendance/2026-10-21           → { "<studentId>": "P" | "A" | "L", … }
PUT /api/attendance/2026-10-21           body: the same map — saves the day's register
```

## Notes

- Data persists in `server/data.json` (created on first run).
- The demo auth is a placeholder — implement real auth before production.
