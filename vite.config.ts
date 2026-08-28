import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Dockerは直下、GitHub Pagesはリポジトリ名の配下で公開される。
  base: process.env.GITHUB_ACTIONS ? '/neko-flowchart/' : '/',
  plugins: [react()],
})
