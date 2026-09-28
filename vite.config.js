import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://api.wonder.p-e.kr'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // 운영 API는 CORS 허용 목록에 없는 Origin을 403으로 막고,
        // http:// 오리진은 설정상 전부 거부된다(localhost 포함).
        // 개발 서버가 서버 측에서 대신 호출하고 Origin·Referer를 떼서 이 제약을 우회한다.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
            })
          },
        },
      },
    },
  }
})
