@echo off
chcp 65001 > nul
echo =============================================
echo  適性診断システム　ローカルサーバー起動中
echo  ブラウザで開く: http://localhost:8080
echo  止めるには: Ctrl + C
echo =============================================
cd /d "%~dp0"
python -m http.server 8080
pause
