@echo off
title Memory Master – 60 Second Challenge
echo ========================================================
echo   Launching Memory Master – 60 Second Challenge...
echo ========================================================
cd /d "%~dp0"

:: 1. If the standalone Memory-Master.html file exists, open it immediately!
:: This works on ANY PC without needing Node.js or npm installed.
if exist "%~dp0Memory-Master.html" (
    echo Opening standalone game in your browser...
    start "" "%~dp0Memory-Master.html"
    exit /b
)

if exist "%~dp0dist\index.html" (
    echo Opening standalone game in your browser...
    start "" "%~dp0dist\index.html"
    exit /b
)

:: 2. Fallback for development if standalone file is missing
where npm.cmd >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" http://localhost:5173/
    npm.cmd run dev
) else (
    echo Node.js is not installed on this PC.
    echo Please make sure Memory-Master.html is present.
    pause
)
