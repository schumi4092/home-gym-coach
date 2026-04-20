$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$portableRoot = Join-Path $projectRoot "release\my-workout-portable"
$target = Join-Path $portableRoot "open-workout.bat"

if (-not (Test-Path -LiteralPath $target)) {
  throw "Missing portable build at $target. Run package-portable.ps1 first."
}

$desktop = [Environment]::GetFolderPath("Desktop")
$shortcut = Join-Path $desktop "Home Gym Coach.lnk"

$wsh = New-Object -ComObject WScript.Shell
$s = $wsh.CreateShortcut($shortcut)
$s.TargetPath = Join-Path $env:SystemRoot "System32\cmd.exe"
$s.Arguments = '/c "' + $target + '"'
$s.WorkingDirectory = $portableRoot
$s.IconLocation = (Join-Path $env:SystemRoot "System32\imageres.dll") + ",15"
$s.WindowStyle = 7
$s.Save()

Write-Host "Desktop shortcut created:"
Write-Host $shortcut
