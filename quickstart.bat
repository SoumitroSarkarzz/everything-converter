@echo off
REM Everything Converter - Quick Start Script for Windows
REM Usage: quickstart.bat

echo.
echo ==================================
echo 🚀 Everything Converter - Quick Start
echo ==================================
echo.

echo 📁 Checking files...
setlocal enabledelayedexpansion
set files=index.html style.css script.js sw.js manifest.json

for %%f in (%files%) do (
    if exist "%%f" (
        echo ✅ %%f
    ) else (
        echo ❌ %%f (MISSING)
    )
)

echo.
echo 🌐 Starting local development server...
echo.
echo Choose how to start:
echo   1. Python (Recommended)
echo   2. Node.js (npx http-server)
echo   3. PHP
echo.

:choice
set /p option="Enter option (1-3): "

if "%option%"=="1" (
    echo.
    echo Starting with Python...
    python -m http.server 8000
    goto :eof
)

if "%option%"=="2" (
    echo.
    echo Starting with Node.js...
    echo Installing http-server...
    npx http-server
    goto :eof
)

if "%option%"=="3" (
    echo.
    echo Starting with PHP...
    php -S localhost:8000
    goto :eof
)

echo Invalid option. Please try again.
goto :choice

:eof
echo.
echo Server stopped.
pause
