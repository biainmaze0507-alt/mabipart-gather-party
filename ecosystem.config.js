module.exports = {
  apps: [
    // Flask 앱
    {
      name: 'mabipart-flask',
      script: 'app.py',
      cwd: 'd:\\마비팟\\파티모집\\새 폴더',
      interpreter: 'python',
      watch: true,                          // 파일 수정 감지 시 자동 재시작
      ignore_watch: ['node_modules', '.git', '__pycache__'],
      max_memory_restart: '500M',            // 500MB 초과 시 자동 재시작
      error_file: 'logs/err.log',            // 에러 로그
      out_file: 'logs/out.log',              // 일반 로그
      env: {
        FLASK_ENV: 'development',
        FLASK_DEBUG: 'True'
      },
      autorestart: true,                    // 강제 종료 시 자동 재시작
      max_restarts: 10,                     // 최대 재시작 횟수
      min_uptime: '10s'                     // 10초 이상 실행되어야 정상으로 판단
    },

    // ngrok 터널
    {
      name: 'mabipart-ngrok',
      script: 'C:\\Program Files\\ngrok\\ngrok.exe',
      args: 'http 5000',
      watch: false,                         // ngrok은 감시 안 함
      max_memory_restart: '200M',
      error_file: 'logs/ngrok-err.log',
      out_file: 'logs/ngrok-out.log',
      autorestart: true,
      max_restarts: 5
    },

    // Discord 봇 1
    {
      name: 'astroom-bot',
      script: 'C:\\Users\\hmh\\OneDrive\\사진\\바탕 화면\\astroombot\\index.js',
      cwd: 'C:\\Users\\hmh\\OneDrive\\사진\\바탕 화면\\astroombot',
      watch: true,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      autorestart: true,
      max_restarts: 10
    },

    // Discord 봇 2
    {
      name: 'discord-bot',
      script: 'C:\\Users\\hmh\\OneDrive\\사진\\바탕 화면\\discordbot\\index.js',
      cwd: 'C:\\Users\\hmh\\OneDrive\\사진\\바탕 화면\\discordbot',
      watch: true,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      autorestart: true,
      max_restarts: 10
    }
  ]
};
