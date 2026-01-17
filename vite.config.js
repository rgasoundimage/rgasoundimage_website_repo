import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'   // ✅ this lets us use @ alias

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})

