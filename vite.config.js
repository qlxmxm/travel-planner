import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드(FastAPI)는 8000번 포트. /api 로 시작하는 요청은 백엔드로 넘겨준다 (CORS 설정 불필요)
// 백엔드 라우터가 이미 /api 주소(main.py 의 prefix)를 쓰므로 주소를 그대로 전달한다
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } },
  },
});
