/**
 * UEAB IMS - Express Server
 * Identification Management System for Lost and Found Documents
 * University of Eastern Africa, Baraton
 *
 * Run:
 *   npm install
 *   npm run seed      (one-time, creates default accounts + sample data)
 *   npm run dev       (development, hot reload)
 *   npm start         (production)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Simple request log
app.use((req, _, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'UEAB IMS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/lost', require('./routes/lost.routes'));
app.use('/api/found', require('./routes/found.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// ── 404 handler ──────────────────────────────────────────────
app.use('/api/*', (_, res) => res.status(404).json({ error: 'Endpoint not found' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('\n─────────────────────────────────────────────────');
  console.log(`  🎓  UEAB IMS API running on port ${PORT}`);
  console.log(`  🔗  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  📘  See README.md for the full API list`);
  console.log('─────────────────────────────────────────────────\n');
});