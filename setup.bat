@echo off
echo.
echo  StockMind - Setup (Windows)
echo  ============================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b 1
)
echo [ok] Python found

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo [ok] Node.js found

:: Backend
echo.
echo [info] Setting up backend...
cd backend
if not exist venv (
    python -m venv venv
    echo [ok] Virtual environment created
)
venv\Scripts\activate.batpip install --upgrade pip -q
pip install -r requirements.txt -q
echo [ok] Backend dependencies installed
if not exist models mkdir models
if not exist charts mkdir charts
call venv\Scripts\deactivate.bat
cd ..

:: Frontend
echo.
echo [info] Installing frontend dependencies...
cd frontend
call npm install --silent
echo [ok] Frontend ready
cd ..

echo.
echo  Setup complete!
echo.
echo  Terminal 1 ^(Backend^):
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn main:app --reload --port 8000
echo.
echo  Terminal 2 ^(Frontend^):
echo    cd frontend
echo    npm run dev
echo.
echo  Open http://localhost:3000
echo.
pause
