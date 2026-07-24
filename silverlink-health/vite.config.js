import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' ws://localhost:* ws://127.0.0.1:* https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'self' https://*.firebaseapp.com",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
].join('; ')

const securityHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
})
