@echo off
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo 需要 Node.js 22 或更高版本，请先从 https://nodejs.org/ 安装。
  pause
  exit /b 1
)
start "" http://127.0.0.1:4173/
node scripts\serve-dist.mjs 4173
pause
