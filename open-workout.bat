@echo off
setlocal

set "ROOT=%~dp0"
set "PORTABLE=%ROOT%release\my-workout-portable\open-workout.bat"

if exist "%PORTABLE%" (
  start "" "%PORTABLE%"
  exit /b 0
)

powershell -ExecutionPolicy Bypass -File "%ROOT%package-portable.ps1"

if exist "%PORTABLE%" (
  start "" "%PORTABLE%"
  exit /b 0
)

echo Failed to open workout app.
exit /b 1
