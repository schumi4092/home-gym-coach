param(
  [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path),
  [int]$StartPort = 8765,
  [int]$EndPort = 8765
)

$ErrorActionPreference = "Stop"

function Get-ContentType {
  param([string]$Path)

  switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".js"   { return "text/javascript; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".svg"  { return "image/svg+xml" }
    ".json" { return "application/json; charset=utf-8" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif"  { return "image/gif" }
    ".ico"  { return "image/x-icon" }
    ".webp" { return "image/webp" }
    ".txt"  { return "text/plain; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

function Get-FreePort {
  param([int]$From, [int]$To)

  for ($port = $From; $port -le $To; $port += 1) {
    $listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
    try {
      $listener.Start()
      return $port
    } catch {
      continue
    } finally {
      try { $listener.Stop() } catch {}
    }
  }

  throw "No free port found between $From and $To."
}

function Test-ExistingWorkoutServer {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 2
    return $response.Content -like "*Home Gym Coach*"
  } catch {
    return $false
  }
}

function Get-ReferencedAssets {
  param([string]$IndexPath)

  $content = Get-Content -LiteralPath $IndexPath -Raw
  $matches = [regex]::Matches($content, '(?:src|href)="\.\/([^"]+)"')

  return $matches |
    ForEach-Object { $_.Groups[1].Value } |
    Where-Object { $_ -and ($_ -notmatch '^(?:https?:|data:|mailto:|#)') } |
    Select-Object -Unique
}

function Test-BuildCompleteness {
  param(
    [string]$RootPath,
    [string]$IndexPath
  )

  $missingAssets = @()

  foreach ($assetPath in (Get-ReferencedAssets -IndexPath $IndexPath)) {
    $fullAssetPath = [IO.Path]::GetFullPath((Join-Path $RootPath $assetPath))

    if (-not $fullAssetPath.StartsWith($RootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      continue
    }

    if (-not (Test-Path -LiteralPath $fullAssetPath -PathType Leaf)) {
      $missingAssets += $assetPath
    }
  }

  return $missingAssets
}

function Handle-Client {
  param($client, $root)

  function Get-ContentType2([string]$Path) {
    switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
      ".html" { return "text/html; charset=utf-8" }
      ".js"   { return "text/javascript; charset=utf-8" }
      ".css"  { return "text/css; charset=utf-8" }
      ".svg"  { return "image/svg+xml" }
      ".json" { return "application/json; charset=utf-8" }
      ".png"  { return "image/png" }
      ".jpg"  { return "image/jpeg" }
      ".jpeg" { return "image/jpeg" }
      ".gif"  { return "image/gif" }
      ".ico"  { return "image/x-icon" }
      ".webp" { return "image/webp" }
      ".txt"  { return "text/plain; charset=utf-8" }
      default { return "application/octet-stream" }
    }
  }

  function Write-HttpResponse($Stream, [int]$StatusCode, [string]$StatusText, [byte[]]$Body, [string]$ContentType) {
    $writer = New-Object IO.StreamWriter($Stream, [Text.Encoding]::ASCII, 1024, $true)
    $writer.NewLine = "`r`n"
    $writer.WriteLine("HTTP/1.1 $StatusCode $StatusText")
    $writer.WriteLine("Content-Type: $ContentType")
    $writer.WriteLine("Cache-Control: no-store, no-cache, must-revalidate, max-age=0")
    $writer.WriteLine("Pragma: no-cache")
    $writer.WriteLine("Expires: 0")
    $writer.WriteLine("Content-Length: $($Body.Length)")
    $writer.WriteLine("Connection: close")
    $writer.WriteLine()
    $writer.Flush()
    $Stream.Write($Body, 0, $Body.Length)
    $Stream.Flush()
  }

  try {
    $stream = $client.GetStream()
    $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()

    if ([string]::IsNullOrWhiteSpace($requestLine)) { return }

    while ($true) {
      $headerLine = $reader.ReadLine()
      if ([string]::IsNullOrEmpty($headerLine)) { break }
    }

    $parts = $requestLine.Split(" ")
    $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
    $cleanPath = $rawPath.Split("?")[0].TrimStart("/")
    $requestPath = [Uri]::UnescapeDataString($cleanPath)

    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $localPath = Join-Path $root $requestPath
    $resolvedPath = [IO.Path]::GetFullPath($localPath)

    if (-not $resolvedPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $body = [Text.Encoding]::UTF8.GetBytes("Forbidden")
      Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Body $body -ContentType "text/plain; charset=utf-8"
      return
    }

    if (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
      $body = [Text.Encoding]::UTF8.GetBytes("Not Found")
      Write-HttpResponse -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body $body -ContentType "text/plain; charset=utf-8"
      return
    }

    $body = [IO.File]::ReadAllBytes($resolvedPath)
    $contentType = Get-ContentType2 -Path $resolvedPath
    Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText "OK" -Body $body -ContentType $contentType
  } finally {
    if ($reader) { $reader.Dispose() }
    if ($stream) { $stream.Dispose() }
    $client.Dispose()
  }
}

$Root = $Root.Trim().Trim('"')
$Root = [IO.Path]::GetFullPath($Root)
$indexPath = Join-Path $Root "index.html"

if (-not (Test-Path -LiteralPath $indexPath)) {
  throw "Could not find index.html in $Root"
}

$missingAssets = Test-BuildCompleteness -RootPath $Root -IndexPath $indexPath

if ($missingAssets.Count -gt 0) {
  Write-Host ""
  Write-Host "ERROR: This app package is incomplete." -ForegroundColor Red
  Write-Host ""
  Write-Host "Missing files referenced by index.html:" -ForegroundColor Yellow
  foreach ($asset in $missingAssets) {
    Write-Host " - $asset" -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "Please re-download the full release package or ask the sender to include the entire assets folder." -ForegroundColor Yellow
  Write-Host ""
  pause
  exit 1
}

$port = $null

try {
  $port = Get-FreePort -From $StartPort -To $EndPort
} catch {
  if ($StartPort -eq $EndPort) {
    $existingUrl = "http://127.0.0.1:$StartPort/"
    if (Test-ExistingWorkoutServer -Url $existingUrl) {
      Start-Process $existingUrl | Out-Null
      Write-Host "Home Gym Coach is already running at $existingUrl"
      exit 0
    }
  }

  Write-Host ""
  Write-Host "ERROR: Port $StartPort is already in use by another program." -ForegroundColor Red
  Write-Host ""
  Write-Host "To fix this, close the program using port $StartPort and try again." -ForegroundColor Yellow
  Write-Host "You can find it by running: netstat -ano | findstr :$StartPort" -ForegroundColor Yellow
  Write-Host ""
  pause
  exit 1
}

$prefix = "http://127.0.0.1:$port/"
$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
$listener.Start()

Start-Process $prefix | Out-Null
Write-Host "Home Gym Coach is running at $prefix"
Write-Host "Keep this window open while using the app."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $rootCopy = $Root
    $runspace = [System.Management.Automation.Runspaces.RunspaceFactory]::CreateRunspace()
    $runspace.Open()
    $ps = [System.Management.Automation.PowerShell]::Create()
    $ps.Runspace = $runspace
    $ps.AddScript({
      param($client, $root)

      function Get-CT([string]$Path) {
        switch ([IO.Path]::GetExtension($Path).ToLowerInvariant()) {
          ".html" { return "text/html; charset=utf-8" }
          ".js"   { return "text/javascript; charset=utf-8" }
          ".css"  { return "text/css; charset=utf-8" }
          ".svg"  { return "image/svg+xml" }
          ".json" { return "application/json; charset=utf-8" }
          ".png"  { return "image/png" }
          ".jpg"  { return "image/jpeg" }
          ".jpeg" { return "image/jpeg" }
          ".gif"  { return "image/gif" }
          ".ico"  { return "image/x-icon" }
          ".webp" { return "image/webp" }
          ".txt"  { return "text/plain; charset=utf-8" }
          default { return "application/octet-stream" }
        }
      }

      function Send-Response($stream, [int]$code, [string]$text, [byte[]]$body, [string]$ct) {
        $w = New-Object IO.StreamWriter($stream, [Text.Encoding]::ASCII, 1024, $true)
        $w.NewLine = "`r`n"
        $w.WriteLine("HTTP/1.1 $code $text")
        $w.WriteLine("Content-Type: $ct")
        $w.WriteLine("Cache-Control: no-store, no-cache, must-revalidate, max-age=0")
        $w.WriteLine("Pragma: no-cache")
        $w.WriteLine("Expires: 0")
        $w.WriteLine("Content-Length: $($body.Length)")
        $w.WriteLine("Connection: close")
        $w.WriteLine()
        $w.Flush()
        $stream.Write($body, 0, $body.Length)
        $stream.Flush()
      }

      try {
        $stream = $client.GetStream()
        $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
        $requestLine = $reader.ReadLine()
        if ([string]::IsNullOrWhiteSpace($requestLine)) { return }

        while ($true) {
          $h = $reader.ReadLine()
          if ([string]::IsNullOrEmpty($h)) { break }
        }

        $parts = $requestLine.Split(" ")
        $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
        $cleanPath = $rawPath.Split("?")[0].TrimStart("/")
        $requestPath = [Uri]::UnescapeDataString($cleanPath)
        if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = "index.html" }

        $localPath = Join-Path $root $requestPath
        $resolvedPath = [IO.Path]::GetFullPath($localPath)

        if (-not $resolvedPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
          Send-Response $stream 403 "Forbidden" ([Text.Encoding]::UTF8.GetBytes("Forbidden")) "text/plain; charset=utf-8"
          return
        }

        if (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
          Send-Response $stream 404 "Not Found" ([Text.Encoding]::UTF8.GetBytes("Not Found")) "text/plain; charset=utf-8"
          return
        }

        $body = [IO.File]::ReadAllBytes($resolvedPath)
        Send-Response $stream 200 "OK" $body (Get-CT $resolvedPath)
      } finally {
        if ($reader) { $reader.Dispose() }
        if ($stream) { $stream.Dispose() }
        $client.Dispose()
      }
    }) | Out-Null
    $ps.AddArgument($client) | Out-Null
    $ps.AddArgument($rootCopy) | Out-Null
    $ps.BeginInvoke() | Out-Null
  }
} finally {
  $listener.Stop()
}
