@echo off
echo  Starting YouTube Songrequests Bot
cd %~dp0
node --max-old-space-size=4096 index.js
pause
echo  Shutting Down
pause