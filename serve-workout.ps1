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
    ".js" { return "text/javascript; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".svg" { return "image/svg+xml" }
    ".json" { return "application/json; charset=utf-8" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif" { return "image/gif" }
    ".ico" { return "image/x-icon" }
    ".webp" { return "image/webp" }
    ".txt" { return "text/plain; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

function Get-FreePort {
  param(
    [int]$From,
    [int]$To
  )

  for ($port = $From; $port -le $To; $port += 1) {
    $listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
    try {
      $listener.Start()
      return $port
    } catch {
      continue
    } finally {
      try {
        $listener.Stop()
      } catch {
      }
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

$Root = $Root.Trim().Trim('"')
$Root = [IO.Path]::GetFullPath($Root)
$indexPath = Join-Path $Root "index.html"

if (-not (Test-Path -LiteralPath $indexPath)) {
  throw "Could not find index.html in $Root"
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

  throw
}

$prefix = "http://127.0.0.1:$port/"
$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
$listener.Start()

function Write-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType
  )

  $writer = New-Object IO.StreamWriter($Stream, [Text.Encoding]::ASCII, 1024, $true)
  $writer.NewLine = "`r`n"
  $writer.WriteLine("HTTP/1.1 $StatusCode $StatusText")
  $writer.WriteLine("Content-Type: $ContentType")
  $writer.WriteLine("Content-Length: $($Body.Length)")
  $writer.WriteLine("Connection: close")
  $writer.WriteLine()
  $writer.Flush()

  $Stream.Write($Body, 0, $Body.Length)
  $Stream.Flush()
}

Start-Process $prefix | Out-Null
Write-Host "Home Gym Coach is running at $prefix"
Write-Host "Keep this window open while using the app."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      while ($true) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) {
          break
        }
      }

      $parts = $requestLine.Split(" ")
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
      $cleanPath = $rawPath.Split("?")[0].TrimStart("/")
      $requestPath = [Uri]::UnescapeDataString($cleanPath)

      if ([string]::IsNullOrWhiteSpace($requestPath)) {
        $requestPath = "index.html"
      }

      $localPath = Join-Path $Root $requestPath
      $resolvedPath = [IO.Path]::GetFullPath($localPath)

      if (-not $resolvedPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $body = [Text.Encoding]::UTF8.GetBytes("Forbidden")
        Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Body $body -ContentType "text/plain; charset=utf-8"
        continue
      }

      if (-not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
        $body = [Text.Encoding]::UTF8.GetBytes("Not Found")
        Write-HttpResponse -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body $body -ContentType "text/plain; charset=utf-8"
        continue
      }

      $body = [IO.File]::ReadAllBytes($resolvedPath)
      $contentType = Get-ContentType -Path $resolvedPath
      Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText "OK" -Body $body -ContentType $contentType
    } finally {
      if ($reader) {
        $reader.Dispose()
      }
      if ($stream) {
        $stream.Dispose()
      }
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
