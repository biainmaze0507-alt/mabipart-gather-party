@echo off
chcp 65001 >nul
echo ===============================================
echo   마비노기 파티모집 - PM2 설정
echo ===============================================
echo.
echo [경고] Flask 서버는 Render.com에서 실행 중입니다.
echo        https://mabinogi-party.onrender.com
echo.
echo 이 스크립트는 Discord 봇만 실행합니다.
echo.
pause
pushd "d:\마비팟\파티모집\새 폴더"
pm2 start ecosystem.config.js
pm2 save
echo.
echo PM2 설정 완료!
pause
popd
