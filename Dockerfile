FROM python:3.11-slim

# 시스템 업데이트 및 chromium, chromium-driver 설치
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 복사
COPY . .

# 환경변수 설정 (Render에서 인식하도록)
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# 포트 설정
EXPOSE 10000

# 앱 실행
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000"]
