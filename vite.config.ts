import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'

function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension',
    writeBundle(options: any) {
      const distDir = options.dir || resolve(__dirname, 'dist')

      // Copy manifest
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'))

      // Copy icons
      const pubDir = resolve(distDir, 'public')
      if (!existsSync(pubDir)) mkdirSync(pubDir, { recursive: true })
      ;[16, 32, 48, 128].forEach(size => {
        const src = resolve(__dirname, 'public', `icon${size}.png`)
        const dst = resolve(pubDir, `icon${size}.png`)
        if (existsSync(src)) copyFileSync(src, dst)
      })

      // Fix HTML files - copy to root with correct relative paths
      const popupSrc = resolve(distDir, 'src/entrypoints/popup/index.html')
      const sidepanelSrc = resolve(distDir, 'src/entrypoints/sidepanel/index.html')

      if (existsSync(popupSrc)) {
        let html = readFileSync(popupSrc, 'utf-8')
        html = html.replace(/\.\/assets\//g, './assets/')
        writeFileSync(resolve(distDir, 'popup.html'), html)
      }
      if (existsSync(sidepanelSrc)) {
        let html = readFileSync(sidepanelSrc, 'utf-8')
        html = html.replace(/\.\/assets\//g, './assets/')
        writeFileSync(resolve(distDir, 'sidepanel.html'), html)
      }

      console.log('✓ Chrome extension files ready')
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), chromeExtensionPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/entrypoints/popup/index.html'),
        sidepanel: resolve(__dirname, 'src/entrypoints/sidepanel/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'esnext',
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
