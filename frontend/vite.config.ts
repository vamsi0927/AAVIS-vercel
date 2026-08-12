import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/AAVIS-vercel/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    allowedHosts: true
  }
})
