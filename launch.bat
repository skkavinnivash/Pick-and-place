@echo off
title Memory Master - Hand Tracking Launcher
color 0A
cls

echo ============================================================
echo   Memory Master - Hand Tracking + Game Launcher
echo ============================================================
echo.

cd /d "%~dp0"

:: ── Check for Python first (Recommended launcher) ─────────────
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detected. Starting unified launcher via launch.py...
    python "%~dp0launch.py"
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Launcher encountered an error.
        pause
    )
    exit /b
)

:: ── Check npm (use npm.cmd on Windows) ────────────────────────
npm.cmd --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Re-install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm.cmd --version') do set NPM_VER=%%v
echo [OK] npm v%NPM_VER% found.
echo.

:: ── Install dependencies if node_modules missing ───────────────
if not exist "node_modules\" (
    echo [SETUP] Installing dependencies, please wait...
    call npm.cmd install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed. Check your internet connection.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
    echo.
)

echo [INFO] Starting Vite dev server...
echo [INFO] Hand tracking will AUTO-START when the game loads.
echo [INFO] Allow camera permission when the browser asks.
echo.
echo ------------------------------------------------------------
echo   DO NOT close this window - it keeps the server running
echo ------------------------------------------------------------
echo.

:: ── Launch the dev server in a SEPARATE visible window ────────
start "Memory Master - Dev Server" cmd /k npm.cmd run dev

:: ── Wait for server to respond on port 5173 ───────────────────
echo [WAIT] Waiting for server to start...
set /a ATTEMPTS=0

:WAIT_LOOP
set /a ATTEMPTS+=1
if %ATTEMPTS% GTR 40 (
    echo [WARN] Server is slow to respond - opening browser anyway...
    goto OPEN_BROWSER
)
timeout /t 1 /nobreak >nul 2>&1

:: Use PowerShell to check if port is open
powershell -NoProfile -NonInteractive -Command ^
  "try { (New-Object Net.Sockets.TcpClient).Connect('localhost',5173); exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto OPEN_BROWSER
goto WAIT_LOOP

:OPEN_BROWSER
echo [OK] Server is up! Opening browser...
echo.

:: Open browser with autoCamera flag to auto-start hand tracking
start "" "http://localhost:5173/?autoCamera=1"

echo ============================================================
echo   Memory Master is RUNNING!
echo.
echo   Browser : http://localhost:5173
echo   Camera  : Auto-starting (grant permission in browser)
echo.
echo   To STOP: Close the "Memory Master - Dev Server" window
echo   This window can be closed now.
echo ============================================================
echo.
pause
