@echo off
title FORENSIQ - Frontend Server
echo ========================================================
echo Starting FORENSIQ Frontend (Vite + React + Tailwind)
echo ========================================================

:: Safely navigate to the frontend directory relative to this script
cd /d "%~dp0frontend"

:: Verify package.json exists to prevent path errors
if not exist "package.json" (
    echo [ERROR] package.json NOT found!
    echo Current working directory: %CD%
    echo Expected path: %~dp0frontend\package.json
    pause
    exit /b 1
)

echo.
echo ========================================================
echo FRONTEND URL: http://localhost:5173
echo ========================================================
echo.

:: Automatically open FORENSIQ in Microsoft Edge after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak > nul && start msedge http://localhost:5173"

echo Starting Vite development server...
call npm run dev

pause
