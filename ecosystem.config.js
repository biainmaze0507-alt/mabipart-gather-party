module.exports = {
  apps: [
    // ⚠️ 참고: Flask 앱은 Render.com에서 실행 중입니다.
    // 로컬 개발 시에만 아래 주석을 해제하여 사용하세요.
    /*
    {
      name: 'mabipart-flask',
      script: 'app.py',
      cwd: 'd:\\마비팟\\파티모집\\새 폴더',
      interpreter: 'python',
      watch: true,
      ignore_watch: ['node_modules', '.git', '__pycache__'],
      max_memory_restart: '500M',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      env: {
        FLASK_ENV: 'development',
        FLASK_DEBUG: 'True'
      },
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    */

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
