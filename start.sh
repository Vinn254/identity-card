#!/usr/bin/env bash
# UEAB IMS - One-command starter
# Starts the backend, then the frontend on a separate port.
# Opens the frontend in your default browser when ready.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "  UEAB IMS - Starting full stack"
echo "================================================"

# 1. Backend
cd "$ROOT/backend"
if [ ! -d node_modules ]; then
  echo "→ Installing backend dependencies..."
  npm install --silent
fi
if [ ! -f .env ]; then
  echo "→ Creating .env from template..."
  cp .env.example .env
fi
if [ ! -f data/ueab_ims.db ]; then
  echo "→ Seeding database (demo accounts + sample data)..."
  npm run seed
fi
echo "→ Starting backend on http://localhost:5000 ..."
( npm start > "$ROOT/backend.log" 2>&1 & )
BACKEND_PID=$!
sleep 2

# 2. Frontend
cd "$ROOT/frontend"
echo "→ Starting frontend on http://localhost:5500 ..."
( python3 -m http.server 5500 > "$ROOT/frontend.log" 2>&1 & )
FRONTEND_PID=$!
sleep 1

echo ""
echo "================================================"
echo "  ✅  UEAB IMS is up!"
echo "  🌐  Frontend:  http://localhost:5500"
echo "  🔌  Backend:   http://localhost:5000/api/health"
echo ""
echo "  Demo accounts:"
echo "    admin@ueab.ac.ke       / admin123"
echo "    john@ueab.ac.ke        / student123"
echo "    security@ueab.ac.ke    / security123"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo "================================================"

# Try to open the browser
if command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:5500 2>/dev/null &
elif command -v open     >/dev/null 2>&1; then open     http://localhost:5500 2>/dev/null &
fi

# Wait for Ctrl+C
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
