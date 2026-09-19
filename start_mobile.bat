@echo off
cd /d "%~dp0"

echo ========================================================
echo  AgriSight Mobile Live Launcher (HTTPS + Full Hardware)
echo ========================================================
echo.

:: Clean up old instances
echo [1/3] Clearing existing ports (3000, 8000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul

echo [2/3] Launching FastAPI Backend (Port 8000)...
start "AgriSight-Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [3/3] Launching Next.js Frontend (Port 3000)...
timeout /t 3 /nobreak > nul
start "AgriSight-Frontend" cmd /k "cd frontend && npm run dev -- -H 0.0.0.0"

timeout /t 4 /nobreak > nul

echo.
echo ========================================================
echo  STARTING SECURE MOBILE HTTPS TUNNEL
echo ========================================================
echo  This generates a secure HTTPS link for your mobile phone.
echo  Secure HTTPS enables full Mobile Camera, Voice Mic, and GPS!
echo ========================================================
echo.

:: Launch Serveo tunnel in foreground to display the live HTTPS URL
echo Connecting tunnel... Look for the https:// URL below:
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 serveo.net

pause
