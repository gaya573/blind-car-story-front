import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// 개발 서버의 /api 는 운영 API로 프록시된다. 화면을 확인하다 상담·분석 로그가 운영 DB에 쌓이지 않도록
// 조회(GET) 외의 요청은 기본으로 막고 가짜 실패 응답을 돌려준다. 꼭 필요할 때만 VITE_DEV_ALLOW_WRITES=true.
const devWriteGuard = (allowWrites) => ({
  name: 'dev-write-guard',
  configureServer(server) {
    if (allowWrites) return
    server.middlewares.use('/api', (req, res, next) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          success: false,
          devBlocked: true,
          message: '개발 서버는 운영 API에 쓰기 요청을 보내지 않습니다. (VITE_DEV_ALLOW_WRITES=true 로 허용)',
        }),
      )
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'https://api.wonder.p-e.kr'

  return {
    plugins: [react(), devWriteGuard(env.VITE_DEV_ALLOW_WRITES === 'true')],
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
