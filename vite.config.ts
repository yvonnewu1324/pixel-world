import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    allowedHosts: ['qbosv-168-150-59-105.a.free.pinggy.link']
  },
  plugins: [react()],
})
