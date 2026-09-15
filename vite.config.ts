import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// GitHub Pages serves under /charge-spot-quest/
export default defineConfig({
  base: '/charge-spot-quest/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Optional: npm run dev with empty VITE_API_BASE and hit /api via proxy,
      // or set VITE_API_BASE=http://127.0.0.1:8080 for direct calls.
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/readyz': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
