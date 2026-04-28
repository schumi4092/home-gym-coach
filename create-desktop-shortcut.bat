@echo off
setlocal

set "ROOT=%~dp0"
set "PORTABLE_ROOT=%ROOT%release\my-workout-portable"
set "TARGET_BAT=%ROOT%open-workout.bat"
set "WORKDIR=%ROOT%"
set "SHORTCUT=%USERPROFILE%\Desktop\Home Gym Coach.lnk"

if not exist "%TARGET_BAT%" (
  set "TARGET_BAT=%PORTABLE_ROOT%\open-workout.bat"
  set "WORKDIR=%PORTABLE_ROOT%"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:SHORTCUT); $s.TargetPath=$env:TARGET_BAT; $s.WorkingDirectory=$env:WORKDIR; $s.IconLocation=($env:SystemRoot + '\System32\imageres.dll,15'); $s.WindowStyle=1; $s.Save()"

echo Desktop shortcut created:
echo %SHORTCUT%
