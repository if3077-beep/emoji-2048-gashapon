import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// 部署到 GitHub Pages 子路径时（仓库名=emoji-2048-gashapon）需用 /emoji-2048-gashapon/
// 本地开发用 /
const base = process.env.GITHUB_PAGES ? '/emoji-2048-gashapon/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    host: '0.0.0.0',
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1024,
  },
})
