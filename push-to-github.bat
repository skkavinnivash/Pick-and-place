@echo off
title Push to GitHub - Memory Master
color 0B
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"

echo ========================================================
echo   Pushing project to GitHub:
echo   https://github.com/skkavinnivash/Pick-and-place
echo ========================================================
echo.
echo Note: When prompted:
echo   - Username: skkavinnivash
echo   - Password: Use your GitHub Personal Access Token (PAT)
echo     (Get one at: https://github.com/settings/tokens)
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Project successfully pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. Please check your Personal Access Token.
)

echo.
pause
