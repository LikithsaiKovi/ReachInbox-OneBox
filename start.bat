@echo off
echo 🚀 Starting ReachInbox Onebox Advanced Edition...
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting server...
echo 📧 Frontend will be available at: http://localhost:4000
echo 🌐 WebSocket server will run on: ws://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
node server-advanced.js
