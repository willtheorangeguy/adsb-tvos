import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {host: '127.0.0.1'},
  define: {__DEV__: true},
  resolve: {
    dedupe: ['react', 'react-dom'],
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js'],
    alias: {
      'react-native': 'react-native-web',
      '@adsb/shared': path.resolve(rootDir, '../../packages/shared/src'),
    },
  },
})
