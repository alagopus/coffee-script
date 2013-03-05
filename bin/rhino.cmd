@echo off
setlocal
set TOP=%~dp0\..
IF NOT EXIST "%TOP%\lib\coffee-script" set TOP=%TOP%\packages\coffee-script
set CP=%TOP%\jar\js.jar;%TOP%\jar\jna-3.5.1.jar;%TOP%\jar\platform-3.5.1.jar
rem set MAIN=org.mozilla.javascript.tools.debugger.Main
set MAIN=-Djava.awt.headless=true org.mozilla.javascript.tools.shell.Main
java -cp %CP% %MAIN% -version 180 -modules %TOP%\lib\commonjs -modules %TOP%\lib\coffee-script %*
