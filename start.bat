@echo off
echo ==========================================================
echo   FRAUDGRAPH AI - Real-Time Fraud & Mule Detection
echo ==========================================================

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000...
start "FraudGraph AI - Backend" cmd /k "cd backend && set PYTHONPATH=. && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Vite Frontend on http://127.0.0.1:5173...
start "FraudGraph AI - Frontend" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo >>> FraudGraph AI services launched!
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo.
pause
