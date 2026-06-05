@echo off
set NODE_DIR=%~dp0node-v20.18.0-win-x64
set PATH=%NODE_DIR%;%PATH%
echo ========================================
echo Запуск дипломного проекта...
echo Без установки Node.js и npm
echo ========================================
cmd /c "%NODE_DIR%\npm.cmd" run dev
pause