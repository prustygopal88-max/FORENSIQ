@echo off
title FORENSIQ - Windows Host Monitoring Agent
cd /d "%~dp0backend"
echo ========================================================
echo Starting FORENSIQ Windows Host Monitoring Agent...
echo ========================================================
python run_agent.py
pause
