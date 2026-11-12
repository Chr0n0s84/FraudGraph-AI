# FraudGraph AI - Dual Development Runner
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  FRAUDGRAPH AI - Real-Time Fraud & Mule Detection       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python and Node
Write-Host "[1/3] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PYTHONPATH='.'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

Write-Host "[2/3] Waiting for backend to initialize database..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --host 127.0.0.1 --port 5173" -PassThru

Write-Host ""
Write-Host ">>> FraudGraph AI is running!" -ForegroundColor Cyan
Write-Host "Frontend:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "Backend:   http://127.0.0.1:8000" -ForegroundColor White
Write-Host "API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Press Ctrl+C or close the terminal windows to exit." -ForegroundColor Gray
