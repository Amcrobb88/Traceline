param(
  [int]$Port = 5179
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootFull = [System.IO.Path]::GetFullPath($Root)
$Prefix = "http://127.0.0.1:$Port/"

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "text/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".svg" { "image/svg+xml; charset=utf-8"; break }
    default { "application/octet-stream" }
  }
}

function Send-Text {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$Text
  )

  $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  Send-Response $Stream $StatusCode $Reason "text/plain; charset=utf-8" $Bytes
}

function Send-Response {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$ContentType,
    [byte[]]$Body
  )

  $Headers = @(
    "HTTP/1.1 $StatusCode $Reason",
    "Content-Type: $ContentType",
    "Content-Length: $($Body.Length)",
    "Cache-Control: no-store",
    "Connection: close",
    "",
    ""
  ) -join "`r`n"

  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Headers)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

$Address = [System.Net.IPAddress]::Parse("127.0.0.1")
$Listener = [System.Net.Sockets.TcpListener]::new($Address, $Port)

try {
  $Listener.Start()
  Write-Host "CRT oscilloscope running at $Prefix"
  Write-Host "Press Ctrl+C to stop."

  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    $Stream = $Client.GetStream()
    $Stream.ReadTimeout = 3000
    $Stream.WriteTimeout = 3000
    $Reader = [System.IO.StreamReader]::new($Stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)

    try {
      $RequestLine = $Reader.ReadLine()

      while ($true) {
        $HeaderLine = $Reader.ReadLine()
        if ([string]::IsNullOrEmpty($HeaderLine)) {
          break
        }
      }

      if ([string]::IsNullOrWhiteSpace($RequestLine)) {
        Send-Text $Stream 400 "Bad Request" "Bad request"
        continue
      }

      $Parts = $RequestLine.Split(" ")
      if ($Parts.Length -lt 2 -or $Parts[0] -ne "GET") {
        Send-Text $Stream 405 "Method Not Allowed" "Method not allowed"
        continue
      }

      $RequestPath = $Parts[1].Split("?")[0]

      if ($RequestPath -eq "/") {
        $RequestPath = "/index.html"
      }

      $DecodedPath = [System.Uri]::UnescapeDataString($RequestPath)
      $RelativePath = $DecodedPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
      $FullPath = [System.IO.Path]::GetFullPath((Join-Path $RootFull $RelativePath))

      if (-not $FullPath.StartsWith($RootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text $Stream 403 "Forbidden" "Forbidden"
      } elseif (-not (Test-Path -LiteralPath $FullPath -PathType Leaf)) {
        Send-Text $Stream 404 "Not Found" "Not found"
      } else {
        $Bytes = [System.IO.File]::ReadAllBytes($FullPath)
        Send-Response $Stream 200 "OK" (Get-ContentType $FullPath) $Bytes
      }
    } catch {
      try {
        Send-Text $Stream 500 "Server Error" "Server error"
      } catch {
        # The peer may already have disconnected or timed out.
      }
    } finally {
      $Reader.Dispose()
      $Stream.Dispose()
      $Client.Dispose()
    }
  }
} finally {
  $Listener.Stop()
}
