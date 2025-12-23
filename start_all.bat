@echo off
echo Starting FinFraudX Application...

echo Starting Backend Server...
cd backend
start "Backend" /min python backend_app.py

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
cd ../frontend
start "Frontend" /min npm start

echo.
echo Servers started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul