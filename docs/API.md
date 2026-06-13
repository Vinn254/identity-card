# 📡 API Documentation — UEAB IMS

Base URL (dev): `http://localhost:5000/api`
All protected endpoints require `Authorization: Bearer <jwt>` header.

---

## 🔐 Auth

### `POST /api/auth/register` — Create a new student account
Body:
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2547...",
  "registration_number": "UEAB/24/00010",
  "password": "secret123",
  "confirm_password": "secret123"
}
```
Returns `201` + `{ token, user }`.

### `POST /api/auth/login` — Email or reg # + password
Body: `{ "email": "john@ueab.ac.ke", "password": "student123" }`
Returns `200` + `{ token, user }`. The `email` field accepts the registration number too.

### `GET /api/auth/me` — Current user (auth)
Returns `{ user: {...} }`.

---

## 📄 Lost documents

### `POST /api/lost` — Report a lost document (auth)
Body:
```json
{
  "document_type": "Student ID",
  "document_number": "UEAB/23/00123",
  "date_lost": "2024-05-13",
  "location_lost": "Main Library",
  "description": "Blue card with lanyard"
}
```
Triggers automatic matching against pending `found_documents`.

### `GET /api/lost/mine` — List current user's lost reports (auth)

### `GET /api/lost/stats/me` — Dashboard counters (auth)
Returns `{ lost, found, recovered, notifications }`.

### `GET /api/lost` — All lost reports (admin / security / staff)

### `GET /api/lost/:id` — Single lost report (auth)

### `PATCH /api/lost/:id/status` — Update status (auth)
Body: `{ "status": "matched" | "recovered" | "closed" }`

---

## 📋 Found documents

### `POST /api/found` — Report a found document (auth, multipart)
Form fields: `document_type`, `document_number`, `date_found`, `location_found`,
`finder_contact`, `description`. Optional file field: `image` (png/jpg/webp, ≤5MB).
Triggers automatic matching against pending `lost_documents`.

### `GET /api/found/mine` — List current user's found reports (auth)

### `GET /api/found` — All found reports (admin / security / staff)

### `PATCH /api/found/:id/status` — Update status (auth)
Body: `{ "status": "matched" | "claimed" | "closed" }`

---

## 🔍 Search

### `GET /api/search` — Search lost &amp; found (auth)
Query params: `q`, `type`, `doc_number`, `status`
Returns `{ lost: [...], found: [...] }`.

---

## 🔔 Notifications

### `GET /api/notifications` — List user's notifications (auth)
### `GET /api/notifications/unread-count` — Badge count (auth)
### `PATCH /api/notifications/:id/read` — Mark one read (auth)
### `PATCH /api/notifications/mark-all-read` — Mark all read (auth)

---

## 🛡 Admin

### `GET /api/admin/overview` — Counters (admin)
```json
{ "users": 4, "lost": 2, "found": 3, "recovered": 0, "matched": 2,
  "pending_lost": 0, "pending_found": 1 }
```

### `GET /api/admin/users` — List users (admin)

### `PATCH /api/admin/users/:id/active` — Activate / deactivate (admin)
Body: `{ "is_active": true | false }`

### `GET /api/admin/reports` — Combined lost + found (admin / security / staff)
### `GET /api/admin/matches` — All automatic matches (admin / security / staff)
### `GET /api/admin/activity` — Activity log (admin)

---

## 🤖 Automatic matching algorithm

When a new **lost** report is created:
1. Look for any `found_documents` row with `status='pending'` where
   `LOWER(TRIM(document_type))` and `LOWER(TRIM(document_number))` match.
2. If found:
   - Set both records to `status='matched'` and link via `matched_with_id`.
   - Create a `match` notification for both users.

The same logic runs in reverse when a new **found** report is created.

---

## 📦 Sample request (curl)

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@ueab.ac.ke","password":"student123"}'

# Report a lost document
curl -X POST http://localhost:5000/api/lost \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "Student ID",
    "document_number": "UEAB/23/00123",
    "date_lost": "2024-05-13",
    "location_lost": "Main Library"
  }'

# Search
curl "http://localhost:5000/api/search?q=UEAB" \
  -H "Authorization: Bearer <token>"
```

---

## ⚠️ Error format

```json
{ "error": "Human-readable message" }
```

| Code | Meaning |
|------|---------|
| 400  | Validation error / missing field |
| 401  | Missing or invalid JWT |
| 403  | Authenticated but role not allowed |
| 404  | Resource not found |
| 409  | Conflict (e.g. email already exists) |
| 500  | Server error |
