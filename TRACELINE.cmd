@echo off
setlocal

set "ROOT=%~dp0"
set "APP=%ROOT%index.html"
set "APPURL=%APP:\=/%"
set "FIREFOX=%ProgramFiles%\Mozilla Firefox\firefox.exe"
set "FIREFOX86=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE64=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%FIREFOX%" (
  start "" "%FIREFOX%" -new-window "file:///%APPURL%"
  exit /b
)

if exist "%FIREFOX86%" (
  start "" "%FIREFOX86%" -new-window "file:///%APPURL%"
  exit /b
)

if exist "%EDGE%" (
  start "" "%EDGE%" --app="file:///%APPURL%"
  exit /b
)

if exist "%EDGE64%" (
  start "" "%EDGE64%" --app="file:///%APPURL%"
  exit /b
)

if exist "%CHROME%" (
  start "" "%CHROME%" --app="file:///%APPURL%"
  exit /b
)

if exist "%CHROME86%" (
  start "" "%CHROME86%" --app="file:///%APPURL%"
  exit /b
)

start "" "%APP%"
