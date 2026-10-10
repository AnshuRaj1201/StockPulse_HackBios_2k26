@echo off
title StockPulse - Smart Campus Inventory & Reorder Tracker
echo ===============================================================
echo        STOCKPULSE - SMART INVENTORY & REORDER TRACKER
echo             Team War Machine - HACKBIOS Project
echo ===============================================================
echo.
echo [1/2] Starting StockPulse Backend API (Port 5000)...
start "StockPulse-Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting StockPulse Frontend PWA (Port 3000)...
start "StockPulse-Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ===============================================================
echo StockPulse is running!
echo URL: http://localhost:3000
echo Backend API: http://localhost:5000/api/health
echo ===============================================================
start http://localhost:3000