@echo off
title FORENSIQ - Backend Server
echo ========================================================
echo Starting FORENSIQ Backend (FastAPI + SQLite Engine)
echo ========================================================

:: Safely navigate to the backend directory relative to this script
cd /d "%~dp0backend"

:: Verify backend entrypoint exists
if not exist "app\main.py" (
    echo [ERROR] Could not find backend\app\main.py
    echo Current working directory: %CD%
    pause
    exit /b 1
)

echo.
echo ========================================================
echo BACKEND: http://127.0.0.1:8000
echo SWAGGER: http://127.0.0.1:8000/docs
echo HEALTH:  http://127.0.0.1:8000/api/health
echo ========================================================
echo.

:: Automatically open Swagger documentation in Microsoft Edge after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak > nul && start msedge http://127.0.0.1:8000/docs"

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
