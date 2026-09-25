@echo off
chcp 65001 >nul
title LM Studio Russifier
set "LOG=%TEMP%\lm-studio-russifier.log"
set "NODEEXE=%~dp0node.exe"
if not exist "%NODEEXE%" set "NODEEXE=node"
echo ==============================================
echo   LM Studio Russifier — русский интерфейс LM Studio
echo ==============================================
echo Журнал: %LOG%
"%NODEEXE%" "%~dp0run.js" > "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
type "%LOG%"
echo.
if "%RC%"=="0" echo [OK] Русификация применена. Перезапустите LM Studio.
if not "%RC%"=="0" echo [ОШИБКА] код %RC% — подробности в журнале выше
echo Журнал: %LOG%
pause
exit /b %RC%
