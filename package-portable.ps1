$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$releaseRoot = Join-Path $projectRoot "release"
$portableRoot = Join-Path $releaseRoot "my-workout-portable"

Write-Host "Building project..."
npm run build

if ($LASTEXITCODE -ne 0) {
  throw "Build failed."
}

if (Test-Path $portableRoot) {
  Get-ChildItem -LiteralPath $portableRoot -Recurse -Force |
    Where-Object { $_.FullName -ne $portableRoot -and $_.Name -notin @("open-workout.bat") } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} else {
  New-Item -ItemType Directory -Path $portableRoot | Out-Null
}

$portableDist = Join-Path $portableRoot "dist"
if (-not (Test-Path $portableDist)) {
  New-Item -ItemType Directory -Path $portableDist | Out-Null
}
Copy-Item -Path (Join-Path $projectRoot "dist\*") -Destination $portableDist -Recurse -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "server.js") -Destination $portableRoot -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "serve-workout.ps1") -Destination $portableRoot -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "create-desktop-shortcut.bat") -Destination $portableRoot -Force

$launcher = @'
@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js not found in PATH. Falling back to the legacy PowerShell server.
  echo.
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'powershell.exe' -and $_.CommandLine -match 'serve-workout\.ps1' } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }"
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-workout.ps1" -Root "%~dp0dist" -StartPort 8765 -EndPort 8765
  echo.
  echo [Legacy server stopped. Exit code %ERRORLEVEL%]
  pause
  exit /b %ERRORLEVEL%
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'my-workout-portable\\server\.js' } | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }"

node "%~dp0server.js"
echo.
echo [Server stopped. Exit code %ERRORLEVEL%]
pause
'@

Set-Content -LiteralPath (Join-Path $portableRoot "open-workout.bat") -Value $launcher -Encoding ASCII

Write-Host ""
Write-Host "Portable package created:"
Write-Host $portableRoot
Write-Host ""
Write-Host "Send this folder to your friend."
