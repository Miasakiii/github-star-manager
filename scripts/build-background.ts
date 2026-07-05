// Build script for background service worker
import { build } from 'esbuild'

async function main() {
  await build({
    entryPoints: ['src/entrypoints/background/worker.ts'],
    bundle: true,
    outfile: 'dist/background/worker.js',
    format: 'esm',
    target: 'esnext',
    platform: 'browser',
  })
  console.log('Background worker built successfully')
}

main().catch(console.error)
