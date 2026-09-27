@echo off
:: Ensure we are running from the script's directory
cd /d "%~dp0"

echo ==========================================
echo AgriSight Ecosystem Bootloader (V3)
echo ==========================================

:: Kill any existing processes (silent)
echo Cleaning up existing ports (3000, 8000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %%a 2>nul

echo.
echo [1/2] Launching Backend (FastAPI on 0.0.0.0:8000)...
:: Using start with title and /k to keep window open on error
start "AgriSight-Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Launching Frontend (Next.js on 0.0.0.0:3000)...
:: Small delay for backend
timeout /t 3 /nobreak > nul
start "AgriSight-Frontend" cmd /k "cd frontend && npm run dev -- -H 0.0.0.0"

:: Auto-bridge connected Android devices over USB
echo Setting up Android USB Port Forwarding (adb reverse)...
where adb >nul 2>nul
if %errorlevel% equ 0 (
    adb reverse tcp:8000 tcp:8000 2>nul
    adb reverse tcp:3000 tcp:3000 2>nul
) else if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:8000 tcp:8000 2>nul
    "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" reverse tcp:3000 tcp:3000 2>nul
)

echo.
echo ------------------------------------------
echo Status: Services launched in separate windows.
echo Local PC:      http://localhost:3000
echo Mobile Phone:  Use your local WiFi IP or run start_mobile.bat for HTTPS tunnel
echo API Docs:      http://localhost:8000/docs
echo ------------------------------------------
echo.
echo If any window closed immediately, check if 'python' or 'npm' is installed.
echo Press any key to close this bootloader.
pause
