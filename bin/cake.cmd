@echo off
setlocal
set TOP=%~dp0\..
IF NOT EXIST "%TOP%\lib\coffee-script" set TOP=%TOP%\packages\coffee-script
node %TOP%\lib\coffee-script\cake-run.js %*

