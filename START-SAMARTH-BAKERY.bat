@echo off
title Samarth Bakery - Full Stack
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js is not installed. Please install Node.js 18+ from https://nodejs.org and run this file again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing required packages...
    call npm install
    if errorlevel 1 (
        echo.
        echo npm install failed. Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo.
echo Starting Samarth Bakery...
echo Customer Shop : http://localhost:3000/shop.html
echo Admin Login   : http://localhost:3000/index.html  (admin / admin123)
echo Backend Check : http://localhost:3000/api/health
echo.
start "" "http://localhost:3000/shop.html"
npm start

pause
