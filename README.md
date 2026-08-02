# Identity Card Management System (UEAB IMS)

A web-based Lost and Found Identification Document Management System built for the University of Eastern Africa, Baraton (UEAB). The system helps students and staff report lost identification documents, report found documents, and automatically match lost reports with found reports to reunite owners with their documents.

## Features

- **Report Lost Documents** — Students and staff can report lost identification documents (Student ID, National ID, Passport, Laptop, Phone, Charger, etc.)
- **Report Found Documents** — Anyone can report found items and the system automatically checks for matching lost reports
- **Auto-Matching** — When a lost and found report match (same document type and number), both parties are notified automatically
- **Admin Dashboard** — Real-time statistics overview with clickable cards for Active Users, Lost Documents, Found Documents, Recovered Documents, and Notifications
- **User Management** — Admins can view all users, activate/deactivate accounts
- **Notifications** — Real-time notification system for match updates
- **Search** — Search the database by document type, number, or location
- **Demo Mode** — Fully functional frontend with localStorage-based demo data for testing without a live backend

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer (for document images)

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Backend Setup
```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend Setup
Open `frontend/index.html` in a browser, or serve it with any static file server:
```bash
npx serve frontend -l 5500
```

### Demo Mode
The frontend includes a built-in demo mode (`window.USE_DEMO_MODE = true`) that uses localStorage for data, allowing full UI testing without a live backend.

**Demo Accounts:**
| Email | Password | Role |
|-------|----------|------|
| admin@ueab.ac.ke | admin123 | Admin |
| john@ueab.ac.ke | student123 | Student |
| security@ueab.ac.ke | security123 | Security |

## Project Structure
```
identity-card/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers (auth, lost, found, admin, etc.)
│   │   ├── middleware/      # Auth and role-based access control
│   │   ├── routes/         # Express route definitions
│   │   └── utils/          # Seed script and utilities
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── main.css        # Global styles
│   ├── js/
│   │   ├── api.js          # API client and auth helpers
│   │   ├── demo-mode.js    # Demo mode with localStorage
│   │   └── layout.js       # Sidebar and header layout builder
│   ├── admin.html           # Admin dashboard
│   ├── dashboard.html       # User dashboard
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── report-lost.html     # Report lost document form
│   ├── report-found.html    # Report found document form
│   ├── my-reports.html      # User's reports
│   ├── search.html          # Search page
│   └── notifications.html   # Notifications page
└── README.md
```

## License
MIT
