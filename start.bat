@echo off
echo Starting Synapse Lite...

:: Start Backend
start "Synapse Backend" cmd /k "cd backend && pip install -r requirements.txt && uvicorn main:app --reload"

:: Start Frontend
start "Synapse Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo Services started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo.
echo Press any key to exit this launcher (services will keep running)...
pause >nul
