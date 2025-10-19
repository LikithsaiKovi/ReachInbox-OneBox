@echo off
echo 🚀 Starting ReachInbox Onebox Demo for Recruiters...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install it from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

REM Start the application
echo 🚀 Starting the application...
echo 📧 Frontend will be available at: http://localhost:4000
echo.
echo Press Ctrl+C to stop the application
echo.

node server-real-gmail.js

pause
