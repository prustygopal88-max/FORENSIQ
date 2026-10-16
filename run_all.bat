@echo off
title FORENSIQ - Master Launcher
echo ========================================================
echo Launching FORENSIQ Forensic Intelligence Platform
echo ========================================================

cd /d "%~dp0"

:: 1. Launch Backend in separate window
echo Starting Backend Server on http://127.0.0.1:8000 ...
start "FORENSIQ Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 2. Wait 2 seconds for backend to bind port
timeout /t 2 /nobreak > nul

:: 3. Launch Frontend in separate window
echo Starting Frontend Server on http://localhost:5173 ...
start "FORENSIQ Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 4. Wait 2 seconds and open Microsoft Edge with both Frontend and Swagger Docs
timeout /t 2 /nobreak > nul
echo Opening Microsoft Edge to FORENSIQ and Swagger Docs...
start msedge "http://localhost:5173"
start msedge "http://127.0.0.1:8000/docs"

echo.
echo ========================================================
echo FORENSIQ is active!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo Swagger:  http://127.0.0.1:8000/docs
echo Health:   http://127.0.0.1:8000/api/health
echo ========================================================
