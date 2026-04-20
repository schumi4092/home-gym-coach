@echo off
setlocal

set "ROOT=%~dp0"
set "PORTABLE=%ROOT%release\my-workout-portable\open-workout.bat"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'serve-workout\.ps1' }; foreach ($p in $procs) { try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch {} }"

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
