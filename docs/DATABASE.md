# 🗄 Database Documentation — UEAB IMS

**Engine:** Supabase (PostgreSQL)
**Connection:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
**Driver:** `@supabase/supabase-js`

---

## 📐 Schema overview

```
┌──────────┐      ┌─────────────────┐      ┌──────────────────┐
│  users   │──1:N─│ lost_documents  │◄────►│ found_documents  │  (via matched_with_id)
└──────────┘      └─────────────────┘      └──────────────────┘
     │                  │                        │
     │ 1:N              │ 1:N                    │ 1:N
     ▼                  ▼                        ▼
┌────────────────────────────────────────────────────┐
│                  notifications                     │
└────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌────────────────┐
                   │  activity_log  │
                   └────────────────┘
```

---

## 📋 Tables SQL

See [`SUPABASE_SCHEMA.sql`](./SUPABASE_SCHEMA.sql) for the complete SQL schema to run in Supabase SQL Editor.

### `users`

| Column              | Type      | Notes                                              |
|---------------------|-----------|----------------------------------------------------|
| id                  | UUID      | PK                                                 |
| full_name           | TEXT      | not null                                           |
| registration_number | TEXT      | unique, nullable (for admin)                       |
| email               | TEXT      | unique, not null                                     |
| phone               | TEXT      | nullable                                           |
| password_hash       | TEXT      | bcrypt                                             |
| role                | TEXT      | `student` \| `staff` \| `security` \| `admin`       |
| is_active           | BOOLEAN   | default true                                       |
| created_at          | TIMESTAMP | default now()                                      |
| updated_at          | TIMESTAMP | default now()                                      |

### `lost_documents`

| Column         | Type     | Notes                                    |
|----------------|----------|------------------------------------------|
| id             | UUID     | PK                                       |
| user_id        | UUID     | FK → users.id (the owner)                |
| document_type  | TEXT     | not null                                 |
| document_number| TEXT     | not null, indexed                        |
| date_lost      | DATE     | not null                                 |
| location_lost  | TEXT     |                                          |
| description    | TEXT     |                                          |
| status         | TEXT     | `pending` \| `matched` \| `recovered` \| `closed` |
| matched_with_id| UUID     | FK → found_documents.id                  |
| created_at     | TIMESTAMP|                                          |
| updated_at     | TIMESTAMP|                                          |

### `found_documents`

| Column         | Type     | Notes                                    |
|----------------|----------|------------------------------------------|
| id             | UUID     | PK                                       |
| user_id        | UUID     | FK → users.id (the finder)               |
| document_type  | TEXT     |                                          |
| document_number| TEXT     |                                          |
| date_found     | DATE     |                                          |
| location_found | TEXT     | not null                                 |
| finder_contact | TEXT     |                                          |
| image_path     | TEXT     | relative path under `/uploads/...`         |
| description    | TEXT     |                                          |
| status         | TEXT     | `pending` \| `matched` \| `claimed` \| `closed` |
| matched_with_id| UUID     | FK → lost_documents.id                   |
| created_at     | TIMESTAMP|                                          |
| updated_at     | TIMESTAMP|                                          |

### `notifications`

| Column          | Type     | Notes                                    |
|-----------------|----------|------------------------------------------|
| id              | UUID     | PK                                       |
| user_id         | UUID     | FK → users.id                            |
| title           | TEXT     |                                          |
| message         | TEXT     |                                          |
| type            | TEXT     | `info` \| `success` \| `warning` \| `match` \| `system` |
| is_read         | BOOLEAN  | default false                            |
| related_lost_id | UUID     | optional FK                              |
| related_found_id| UUID     | optional FK                              |
| created_at      | TIMESTAMP|                                          |

### `activity_log`

| Column      | Type     | Notes                              |
|-------------|----------|------------------------------------|
| id          | UUID     | PK                                 |
| user_id     | UUID     | nullable (system actions)            |
| action      | TEXT     | e.g. `auto_match`, `create_lost`   |
| entity_type | TEXT     | e.g. `lost_document`               |
| entity_id   | UUID     |                                    |
| details     | TEXT     |                                    |
| created_at  | TIMESTAMP|                                    |

---

## 🔄 Data lifecycle

```
LOST REPORT   ──────► [pending]  ──auto-match found──► [matched] ──owner claims──► [recovered] ──► [closed]
FOUND REPORT  ──────► [pending]  ──auto-match lost ──► [matched] ──owner claims──► [claimed]   ──► [closed]
```

---

## 🔧 Setup Instructions

1. Go to your Supabase project: https://nwydgwpcxlgseofmvbyy.supabase.co
2. Open SQL Editor
3. Run the SQL from [`SUPABASE_SCHEMA.sql`](./SUPABASE_SCHEMA.sql)
4. Get your anon key from Settings > API
5. Update `.env` with your Supabase credentials

---

## 💾 Backups

Use Supabase's built-in backup features or schedule dumps via:
```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```