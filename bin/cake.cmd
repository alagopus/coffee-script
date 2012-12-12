@echo off
setlocal
set TOP=%~dp0\..
IF NOT EXIST "%TOP%\lib\coffee-script" set TOP=%TOP%\packages\coffee-script
cd %TOP%\lib\coffee-script
node -e "require('./cake').run()" %*

