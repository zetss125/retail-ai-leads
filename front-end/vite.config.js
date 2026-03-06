import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/retail-ai-leads/', // THIS line is critical for GitHub Pages
})