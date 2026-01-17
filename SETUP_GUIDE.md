# 배포 가이드 (옵션 A + 디스코드 알림)

이 가이드는 Flask 백엔드를 중앙에 배포하여 사용자가 웹사이트만 접속해 서비스를 이용하도록 구성하고, 파티 등록 시 디스코드 알림을 전송하는 방법을 설명합니다.

## 1. 준비 사항
- Google Apps Script 웹 앱 URL (파티 시트)
- 디스코드 채널의 웹훅 URL
- 배포 대상(Windows VM, Linux 서버, Render/Railway/Azure 등)

## 2. 환경 변수 설정
- `DISCORD_WEBHOOK_URL`: 디스코드 웹훅 URL
- `PARTY_SITE_URL`: 파티 모집 사이트 주소(선택, 있으면 알림에 링크 포함)

Windows PowerShell 예시:

```powershell
$env:DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/...."
$env:PARTY_SITE_URL = "https://your-domain.example.com"
```

Linux/Bash 예시:

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
export PARTY_SITE_URL="https://your-domain.example.com"
```

### .env 파일 사용 (선택)
- `app.py`는 `python-dotenv`가 설치되어 있으면 `.env`를 자동 로드합니다.
- 예시 파일: [.env.example](.env.example)를 `.env`로 복사 후 값 채우기

설치 및 실행 예시:

```bash
pip install python-dotenv
python app.py
```

## 3. 백엔드 배포
1) 의존성 설치 및 로컬 확인

```bash
pip install flask flask-cors selenium webdriver-manager requests
python app.py
```

2) 서버/클라우드에 배포 후 도메인 확인 (예: `https://api.your-domain.example.com`)

## 4. 프런트 설정
- `script.js`의 `API_BASE_URL`을 배포된 Flask 서버 도메인으로 변경
- `GOOGLE_SCRIPT_URL`은 기존 Apps Script 웹 앱 URL 유지

> PARTY_SITE_URL은 실제 공개된 프런트 주소여야 하며, 임의의 도메인을 적어도 접속/링크는 동작하지 않습니다. 실제로 배포된 정적 사이트 URL을 사용하세요.

## 5. 디스코드 알림 동작
- 프런트에서 파티 등록 시, Flask 프록시가 Apps Script로 `addParty` 요청을 전달하고 성공 응답 후 디스코드 웹훅으로 알림을 전송합니다.
- 알림 형식:

```
새로운 파티 모집 정보가 등록되었습니다.
> 대분류: 레이드
> 콘텐츠: 에이렐
> 난이도: 어려움
> 닉네임: 위비아
> 클래스: 화염술사
> 전투력: 58,282
현재 레이드 에이렐, 어려움 등록 인원: 1명
[파티 모집 사이트 바로가기] https://your-domain.example.com
```

- 어비스의 경우 콘텐츠 라인은 생략되며, "현재 어비스, 매우 어려움 등록 인원: N명" 형태로 집계 표시됩니다.

## 6. Apps Script 재배포 주의
- Google Apps Script 코드를 변경한 경우, 웹 앱을 "수정 배포"로 재배포해야 변경 사항이 반영됩니다.

## 7. 문제 해결
- 알림이 오지 않으면 `DISCORD_WEBHOOK_URL` 설정 여부 확인
- 프록시 에러 로그 확인(서버 콘솔)
- 파티 집계는 시트의 최신 데이터를 기준으로 하므로 네트워크 지연 시 1~2초 차이가 날 수 있음
# 구글 스프레드시트 연동 설정 가이드

## 📋 목차
1. [구글 스프레드시트 생성](#1-구글-스프레드시트-생성)
2. [Google Apps Script 설정](#2-google-apps-script-설정)
3. [웹 앱 배포](#3-웹-앱-배포)
4. [프론트엔드 설정](#4-프론트엔드-설정)
5. [테스트](#5-테스트)
6. [문제 해결](#6-문제-해결)

---

## 1. 구글 스프레드시트 생성

### 1-1. 새 스프레드시트 만들기
1. [Google Sheets](https://sheets.google.com) 접속
2. **빈 스프레드시트** 또는 **+** 버튼 클릭
3. 스프레드시트 이름을 `마비노기 파티모집` 등으로 변경

### 1-2. 스프레드시트 ID 확인
스프레드시트 URL에서 ID 복사:
```
https://docs.google.com/spreadsheets/d/[이_부분이_스프레드시트_ID]/edit
```

예시:
```
https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
```
→ 스프레드시트 ID: `1a2b3c4d5e6f7g8h9i0j`

---

## 2. Google Apps Script 설정

### 2-1. Apps Script 에디터 열기
1. 스프레드시트에서 **확장 프로그램** > **Apps Script** 클릭
2. 새 프로젝트가 열립니다

### 2-2. 코드 붙여넣기
1. 기본 코드(`function myFunction() {}`)를 **모두 삭제**
2. `GoogleAppsScript.gs` 파일의 내용을 **전체 복사**하여 붙여넣기

### 2-3. 스프레드시트 ID 설정
코드 상단의 `SPREADSHEET_ID`를 수정:

```javascript
const SPREADSHEET_ID = '여기에_실제_스프레드시트_ID를_붙여넣으세요';
```

예시:
```javascript
const SPREADSHEET_ID = '1a2b3c4d5e6f7g8h9i0j';
```

### 2-4. 프로젝트 저장
1. 프로젝트 이름을 `파티모집 API`로 변경
2. **💾 저장** 버튼 클릭 (Ctrl+S)

### 2-5. 시트 초기화 (선택사항)
1. 함수 선택 드롭다운에서 `initializeSheet` 선택
2. **▶️ 실행** 버튼 클릭
3. 권한 승인 (처음 실행 시)
   - **권한 검토** 클릭
   - 계정 선택
   - **고급** > **이동(안전하지 않은 페이지로 이동)** 클릭
   - **허용** 클릭

---

## 3. 웹 앱 배포

### 3-1. 배포 설정
1. 우측 상단 **배포** > **새 배포** 클릭
2. **배포 유형 선택** 옆 ⚙️ 아이콘 클릭 > **웹 앱** 선택

### 3-2. 배포 설정
다음과 같이 설정:

- **설명**: `파티모집 API v1` (선택사항)
- **다음 계정으로 실행**: **나**
- **액세스 권한**: **모든 사용자** ⚠️ 중요!

### 3-3. 배포 완료
1. **배포** 버튼 클릭
2. **웹 앱 URL** 복사 (매우 중요!)

URL 형식:
```
https://script.google.com/macros/s/AKfycbz.../exec
```

---

## 4. 프론트엔드 설정

### 4-1. script.js 파일 수정
`script.js` 파일을 열고 상단의 `GOOGLE_SCRIPT_URL` 수정:

```javascript
const GOOGLE_SCRIPT_URL = '여기에_복사한_웹_앱_URL을_붙여넣으세요';
```

예시:
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz.../exec';
```

### 4-2. 저장
파일을 저장합니다 (Ctrl+S).

---

## 5. 테스트

### 5-1. Flask 서버 실행
```powershell
cd "d:\마비팟\파티모집\새 폴더"
python app.py
```

### 5-2. 웹페이지 열기
1. `index.html` 파일을 브라우저에서 열기
2. 또는 Python 서버 실행:
   ```powershell
   python -m http.server 8080
   ```
   그 후 http://localhost:8080 접속

### 5-3. 파티 등록 테스트
1. **파티 모집** 탭 클릭
2. **+ 파티 등록** 버튼 클릭
3. 정보 입력:
   - 콘텐츠 선택
   - 난이도 선택
   - **캐릭터 검색** 버튼으로 캐릭터 정보 입력
4. **등록** 버튼 클릭

### 5-4. 구글 스프레드시트 확인
1. 구글 스프레드시트로 돌아가기
2. `파티모집` 시트 확인
3. 방금 등록한 파티 정보가 표시되어야 함

---

## 6. 문제 해결

### ⚠️ 문제 1: "Google Apps Script URL을 설정해주세요" 알림
**원인**: `script.js`에서 URL을 수정하지 않음

**해결**:
1. `script.js` 파일 열기
2. 상단 `GOOGLE_SCRIPT_URL` 수정
3. 저장 후 페이지 새로고침 (F5)

---

### ⚠️ 문제 2: 파티 등록 시 오류 발생
**원인**: Apps Script 권한 문제 또는 배포 설정 오류

**해결**:
1. Apps Script 에디터로 돌아가기
2. **배포** > **배포 관리** 클릭
3. **액세스 권한**이 **모든 사용자**로 설정되어 있는지 확인
4. 아니면 **수정** > **모든 사용자**로 변경 > **배포** 클릭

---

### ⚠️ 문제 3: 데이터가 로드되지 않음
**원인**: 스프레드시트 ID 오류 또는 시트 이름 불일치

**해결**:
1. Apps Script 코드에서 `SPREADSHEET_ID` 확인
2. 스프레드시트 URL에서 ID가 정확한지 확인
3. 시트 이름이 `파티모집`인지 확인 (또는 코드에서 `SHEET_NAME` 수정)

---

### ⚠️ 문제 4: CORS 오류
**원인**: 브라우저 보안 정책

**해결**:
- Google Apps Script 웹 앱은 CORS를 허용하므로 정상적으로 작동해야 합니다
- 혹시 문제가 있다면 브라우저 콘솔(F12)에서 정확한 오류 메시지 확인

---

### ⚠️ 문제 5: 캐릭터 검색 안 됨
**원인**: Flask 서버가 실행되지 않음

**해결**:
```powershell
python app.py
```
Flask 서버가 실행 중인지 확인

---

## 📌 중요 참고사항

### 보안
- Google Apps Script 웹 앱은 **누구나 접근 가능**합니다
- 민감한 정보는 저장하지 마세요
- 필요시 추가 인증 로직 구현 권장

### 데이터 구분
- **개인 숙제 기록**: 로컬스토리지 (브라우저에만 저장)
- **파티 모집**: 구글 스프레드시트 (공유 가능)

### 배포 URL 관리
- 웹 앱 URL은 재배포 시에도 동일하게 유지됩니다
- **새 배포** 대신 **배포 관리**에서 기존 배포를 **수정**하면 URL이 변경되지 않습니다

---

## 🎉 설정 완료!

모든 설정이 완료되었습니다. 이제 파티 모집 정보가 구글 스프레드시트에 실시간으로 저장되고, 여러 사용자가 동시에 접근할 수 있습니다!

### 추가 기능 아이디어
- 파티 모집 만료 시간 추가
- 파티원 수 제한 기능
- 댓글/메시지 기능
- 알림 기능
