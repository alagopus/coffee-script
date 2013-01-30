@echo off
setlocal
set TOP=%~dp0\..
IF NOT EXIST "%TOP%\lib\coffee-script" set TOP=%TOP%\packages\coffee-script
set CP=$top\jar\js.jar;$top\jar\jna-3.5.1.jar;$top\jar\platform-3.5.1.jar
rem set MAIN=org.mozilla.javascript.tools.debugger.Main
main="-Djava.awt.headless=true org.mozilla.javascript.tools.shell.Main"
java -cp %CP% %MAIN% -version 180 -modules $top\lib\commonjs -modules $top\lib\coffee-script "$@"
