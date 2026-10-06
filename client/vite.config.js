import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5174, host: true },
  build: {
    target: 'es2020',
    rolldownOptions: {
      output: {
        // Long-lived vendor chunk: React + router rarely change, so browsers keep
        // them cached across deploys while app code updates.
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|cookie|set-cookie-parser)[\\/]/, priority: 20 },
            { name: 'ui-vendor', test: /node_modules[\\/](lenis|sonner|zustand|lucide-react|clsx|tailwind-merge)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
