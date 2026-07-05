$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$IndexPath = Join-Path $Root "index.html"
$IconPath = Join-Path $Root "traceline.ico"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "TRACELINE.lnk"

$BrowserCandidates = @(
  "${env:ProgramFiles}\Mozilla Firefox\firefox.exe",
  "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
)

$Browser = $BrowserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $Browser) {
  throw "Could not find Firefox, Microsoft Edge, or Google Chrome."
}

$FileUrl = ([System.Uri]::new($IndexPath)).AbsoluteUri
$Arguments = if ((Split-Path -Leaf $Browser) -ieq "firefox.exe") {
  "-new-window `"$FileUrl`""
} else {
  "--app=$FileUrl"
}

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Browser
$Shortcut.Arguments = $Arguments
$Shortcut.WorkingDirectory = $Root
$Shortcut.IconLocation = "$IconPath,0"
$Shortcut.Description = "TRACELINE CRT Audio Scope"
$Shortcut.WindowStyle = 1
$Shortcut.Save()

Write-Host "Created desktop shortcut:"
Write-Host $ShortcutPath
