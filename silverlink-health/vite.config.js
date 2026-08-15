import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const localSupportPlanOrigin = 'http://127.0.0.1:9000'

function getSupportPlanOrigin(apiUrl) {
  try {
    const url = new URL(apiUrl || localSupportPlanOrigin)

    return ['http:', 'https:'].includes(url.protocol) ? url.origin : localSupportPlanOrigin
  } catch {
    return localSupportPlanOrigin
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const supportPlanOrigin = getSupportPlanOrigin(env.VITE_SUPPORT_PLAN_API_URL)
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self' ws://localhost:* ws://127.0.0.1:* https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com ${supportPlanOrigin} https://nominatim.openstreetmap.org https://router.project-osrm.org`,
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://*.firebaseapp.com",
    "img-src 'self' data: https://tile.openstreetmap.org",
    "object-src 'none'",
    "script-src 'self' https://apis.google.com",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
  ].join('; ')
  const securityHeaders = {
    'Content-Security-Policy': contentSecurityPolicy,
    'Permissions-Policy': 'camera=(), geolocation=(self), microphone=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }

  return {
    plugins: [
      vue(),
      {
        name: 'support-plan-csp-origin',
        transformIndexHtml(html) {
          return html.replaceAll('__SUPPORT_PLAN_API_ORIGIN__', supportPlanOrigin)
        },
      },
    ],
    server: {
      headers: securityHeaders,
    },
    preview: {
      headers: securityHeaders,
    },
  }
})
