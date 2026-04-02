@echo off
setlocal

set "TARGET=%~dp0open-workout.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Home Gym Coach.lnk"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut($env:SHORTCUT); $s.TargetPath=$env:TARGET; $s.WorkingDirectory='%~dp0'; $s.IconLocation=($env:SystemRoot + '\System32\imageres.dll,15'); $s.Save()"

echo Desktop shortcut created:
echo %SHORTCUT%
