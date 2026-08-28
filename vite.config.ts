import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Dockerではアプリを http://localhost:18080/ の直下で配信する。
  base: '/',
  plugins: [react()],
})
