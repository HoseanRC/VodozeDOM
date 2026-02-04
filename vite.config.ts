import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    crx({
      manifest,
      contentScripts: {
        injectCss: true
      }
    }),
  ],
  build: {
    minify: false,
    terserOptions: {
      compress: false,
      mangle: false,
    },
    rollupOptions: {
      input: {
        popup: './src/popup/popup.html',
      }
    }
  }
})
