@echo off
chcp 65001 >nul
pushd "d:\마비팟\파티모집\새 폴더"
pm2 start ecosystem.config.js
pm2 save
pm2 startup windows
pause
popd