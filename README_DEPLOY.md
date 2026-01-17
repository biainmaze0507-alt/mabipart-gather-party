# Render.com 무료 배포 가이드

## 📋 배포 단계

### 1단계: GitHub에 코드 업로드

1. GitHub 계정 로그인 (없으면 생성: https://github.com)
2. 새 저장소 생성 (New Repository)
   - Repository name: `mabinogi-party`
   - Public 선택
   - Create repository 클릭

3. 로컬에서 Git 설정 및 푸시:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/당신의아이디/mabinogi-party.git
git push -u origin main
```

### 2단계: Render.com 배포

1. **Render.com 가입**
   - https://render.com 접속
   - "Get Started for Free" 클릭
   - GitHub 계정으로 연결

2. **새 Web Service 생성**
   - Dashboard에서 "New +" 클릭
   - "Web Service" 선택
   - GitHub 저장소 연결 (mabinogi-party 선택)

3. **설정 입력**
   - Name: `mabinogi-party` (또는 원하는 이름)
   - Region: `Singapore` (한국과 가까움)
   - Branch: `main`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Instance Type: `Free`

4. **환경 변수 설정** (선택사항)
   - Advanced > Environment Variables
   - `DISCORD_WEBHOOK_URL`: 디스코드 웹훅 URL
   - `PARTY_SITE_URL`: 사이트 URL

5. **배포 시작**
   - "Create Web Service" 클릭
   - 5-10분 대기 (자동 배포)

### 3단계: URL 확인 및 적용

1. 배포 완료 후 상단에 URL 표시됨
   - 예: `https://mabinogi-party.onrender.com`

2. **script.js 수정**
   - `API_BASE_URL`을 Render URL로 변경
   ```javascript
   const API_BASE_URL = 'https://your-app-name.onrender.com';
   ```

3. **테스트**
   - `https://your-app-name.onrender.com/health` 접속
   - `{"status": "ok"}` 응답 확인

## ⚠️ 주의사항

- **무료 플랜 제한**
  - 15분 동안 요청이 없으면 서버가 sleep 상태로 전환
  - 첫 요청 시 30초-1분 소요 (이후 정상)
  - 매월 750시간 무료 (충분함)

- **업데이트 방법**
  - GitHub에 코드 푸시 시 자동 재배포
  ```bash
  git add .
  git commit -m "Update"
  git push
  ```

## 🔧 문제 해결

- **배포 실패 시**: Render Dashboard > Logs 확인
- **서버 느릴 때**: 처음 접속 시 정상 (sleep 깨우는 중)
- **에러 발생 시**: Environment Variables 확인

## 📱 최종 완료!

배포 후 고정 URL로 언제 어디서나 접속 가능합니다!
