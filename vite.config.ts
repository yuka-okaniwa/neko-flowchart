import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/neko-flowchart/',
  plugins: [react()],
})
