@echo off
REM UEAB IMS - One-command starter (Windows)

echo ================================================
echo   UEAB IMS - Starting full stack
echo ================================================

cd /d "%~dp0backend"
if not exist node_modules (
  echo Installing backend dependencies...
  call npm install
)
if not exist .env (
  echo Creating .env from template...
  copy .env.example .env
)
if not exist data\ueab_ims.db (
  echo Seeding database...
  call npm run seed
)
echo Starting backend on http://localhost:5000 ...
start "UEAB-Backend" cmd /k "npm start"

cd /d "%~dp0frontend"
echo Starting frontend on http://localhost:5500 ...
start "UEAB-Frontend" cmd /k "python -m http.server 5500"

echo.
echo ================================================
echo   UEAB IMS is starting up!
echo   Frontend: http://localhost:5500
echo   Backend:  http://localhost:5000/api/health
echo.
echo   Demo accounts:
echo     admin@ueab.ac.ke    / admin123
echo     john@ueab.ac.ke     / student123
echo     security@ueab.ac.ke / security123
echo ================================================
start http://localhost:5500
