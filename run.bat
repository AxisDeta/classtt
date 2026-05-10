@echo off
REM Quick Start Script for Study Scheduler Flask App

echo.
echo ================================
echo Weekly Study Scheduler
echo Flask App Quick Start
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

REM Navigate to the app directory
cd /d "%~dp0"

echo Checking for virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt -q

echo.
echo ================================
echo Starting Flask Server...
echo ================================
echo.
echo Opening http://localhost:5000 in your browser...
echo Press Ctrl+C to stop the server
echo.

start http://localhost:5000

python app.py

pause
