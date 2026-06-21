# 🔌 Integrations & 3rd-party APIs to Add

This document lists **every integration you can plug into UEAB IMS** to
make it production-ready. For each one: what it does, why you'd want it,
and the rough code shape to add it.

---

## ✅ Already included in the project

| Layer            | Technology                                    |
|------------------|-----------------------------------------------|
| API              | REST (Express)                                |
| Auth             | JWT (jsonwebtoken) + bcryptjs                 |
| Database         | SQLite via `better-sqlite3`                   |
| File uploads     | `multer` (image only, 5 MB cap)               |
| CORS             | `cors`                                        |
| Environment vars | `dotenv`                                      |
| Frontend         | Vanilla JS + Poppins (Google Fonts)           |

---

## 📨 1. Email notifications (HIGH priority)

**Why:** When a match is found, send the owner a real email.
**Provider:** [Resend](https://resend.com) (3 000/month free) or [SendGrid](https://sendgrid.com).
**Add to `backend/`:**
```bash
npm install resend
```
**Env:** `RESEND_API_KEY`, `MAIL_FROM="UEAB IMS <noreply@ueab.ac.ke>"`
**Wire into matching logic** in `lost.controller.js` / `found.controller.js`:
```js
// after a match is created
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: process.env.MAIL_FROM,
  to: owner.email,
  subject: 'Good news — your document was found',
  html: `<p>Hi ${owner.full_name}, your ${docType} (${docNumber}) has been found.</p>`,
});
```

## 📱 2. SMS notifications

**Why:** African universities — students often check SMS more than email.
**Provider (Kenya):** Africa's Talking (https://africastalking.com).
**Env:** `AT_USERNAME=sandbox`, `AT_API_KEY=...`, `AT_SENDER_ID="UEAB"`
```js
const AfricasTalking = require('africastalking')(process.env.AT_USERNAME, process.env.AT_API_KEY);
await AfricasTalking.SMS.send({
  to: [owner.phone],
  message: `UEAB IMS: Your ${docType} (${docNumber}) has been found. Login to claim.`,
});
```

## ☁️ 3. Cloud file storage (S3 / Cloudinary)

**Why:** Move uploaded ID images out of the server disk.
**Provider:** Cloudinary (easiest) — free tier 25 GB.
```bash
npm install cloudinary multer-storage-cloudinary
```
```js
const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name, api_key, api_secret });
// Use cloudinaryStorage in multer instead of diskStorage
```

## 🔍 4. OCR — auto-read ID numbers from images

**Why:** A user uploads a photo of a found ID; the system extracts the ID number.
**Provider:** [Google Cloud Vision](https://cloud.google.com/vision) or [Textract (AWS)](https://aws.amazon.com/textract/).
```bash
npm install @google-cloud/vision
```
```js
// In found.controller.js, after multer:
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
const [result] = await client.textDetection(req.file.path);
const text = result.fullTextAnnotation.text;
// regex out the ID number, prefill document_number
```

## 🔐 5. Two-factor authentication (2FA)

**Why:** Protect admin accounts.
**Provider:** `speakeasy` (TOTP) + `qrcode`.
```bash
npm install speakeasy qrcode
```
- On admin login → prompt for 6-digit TOTP
- Show QR to enroll in Google Authenticator

## 📧 6. OAuth login (Google / Microsoft)

**Why:** Students already have `@ueab.ac.ke` Google accounts.
**Provider:** `passport-google-oauth20`.
```bash
npm install passport passport-google-oauth20
```
- "Continue with Google" button on the login page
- Auto-provision a `student` user on first login

## 📊 7. Analytics dashboard

**Why:** Charts for the admin.
**Provider:** `chart.js` on the frontend (zero infra).
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```
Suggested charts: lost vs found per month, recovery rate, top document types.

## 📨 7. Web push notifications (browser)

**Why:** Toast the user in real time when a match happens.
**Provider:** `web-push` (VAPID).
```bash
npm install web-push
```
- Frontend registers a `serviceWorker.js` + subscribes to push
- Backend pushes a payload when a notification is created

## 🗺 8. Geolocation on "Location Lost / Found"

**Why:** Students type "Library" — but a map pin is more precise.
**Provider:** Browser's `navigator.geolocation` + Leaflet/Mapbox for the map.
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
```
- Add a small map widget on `report-lost.html` / `report-found.html`
- Save `lat` / `lng` columns (add to schema)

## 🧾 9. PDF report generation

**Why:** Admins want printable monthly reports.
**Provider:** `pdfkit` or `puppeteer`.
```bash
npm install pdfkit
```
- New endpoint `GET /api/admin/reports.pdf?from=...&to=...`
- Streams a PDF table of all matches in the period

## 🏛 10. Government / police API (advanced)

**Why:** If a national ID is found and matches a flagged lost report, push to a national DB.
- This is hypothetical and depends on the Kenyan eCitizen / civil registry APIs.
- Add a webhook outbound from the matching code.

## 🧪 11. CI / CD

- GitHub Actions: `npm test`, `npm run build`, deploy to Render / Railway.
- Frontend: deploy `frontend/` as a static site on Vercel / Netlify / Cloudflare Pages.

## 🐳 12. Docker

**Why:** One command spin-up for your supervisor.
```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```
```yaml
# docker-compose.yml
version: '3.9'
services:
  api:
    build: ./backend
    ports: ["5000:5000"]
    volumes: ["./backend/data:/app/data", "./backend/uploads:/app/uploads"]
  web:
    image: nginx:alpine
    volumes: ["./frontend:/usr/share/nginx/html:ro"]
    ports: ["8080:80"]
```

---

## 🛣 Suggested roadmap

| Sprint | Add                                                                  |
|--------|----------------------------------------------------------------------|
| 1     | ✅ Core CRUD + auth + auto-match (this project)                       |
| 2     | Email + SMS notifications                                             |
| 3     | Cloudinary uploads + OCR on found reports                            |
| 4     | Admin charts (Chart.js) + PDF report export                          |
| 5     | OAuth (Google "Sign in with UEAB") + 2FA for admins                  |
| 6     | Web push + geolocation maps                                          |
| 7     | Docker + CI/CD on Render/Vercel                                      |

Each integration is **independent** — you can ship any combination.
