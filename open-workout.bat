@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js not found in PATH. Falling back to the legacy PowerShell server.
  echo.
  powershell -ExecutionPolicy Bypass -File "%~dp0serve-workout.ps1"
  echo.
  echo [Legacy server stopped. Exit code %ERRORLEVEL%]
  pause
  exit /b %ERRORLEVEL%
)

if not exist "%~dp0dist\index.html" (
  echo Building the app for the first time...
  call npm run build
  if errorlevel 1 (
    echo [!] Build failed.
    pause
    exit /b 1
  )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'my-workout\\server\.js' } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }"

node "%~dp0server.js"
echo.
echo [Server stopped. Exit code %ERRORLEVEL%]
pause
