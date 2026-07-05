const { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const distDir = resolve(__dirname, '..', 'dist')

// Copy manifest.json
copyFileSync(resolve(__dirname, '..', 'manifest.json'), resolve(distDir, 'manifest.json'))
console.log('✓ manifest.json copied')

// Copy icons to public/
const pubDir = resolve(distDir, 'public')
if (!existsSync(pubDir)) mkdirSync(pubDir, { recursive: true })
;[16, 32, 48, 128].forEach(size => {
  const src = resolve(__dirname, '..', 'public', `icon${size}.png`)
  const dst = resolve(pubDir, `icon${size}.png`)
  if (existsSync(src)) {
    copyFileSync(src, dst)
    console.log(`✓ icon${size}.png copied`)
  }
})

// Fix and copy HTML files to dist root
function fixHtml(srcPath, destName) {
  if (!existsSync(srcPath)) return
  let html = readFileSync(srcPath, 'utf-8')
  // Replace relative paths from deep subdirectories to root-level ./assets/
  html = html.replace(/src="[^"]*assets\//g, 'src="./assets/')
  html = html.replace(/href="[^"]*assets\//g, 'href="./assets/')
  writeFileSync(resolve(distDir, destName), html)
  console.log(`✓ ${destName} created with fixed paths`)
}

fixHtml(resolve(distDir, 'src/entrypoints/popup/index.html'), 'popup.html')
fixHtml(resolve(distDir, 'src/entrypoints/sidepanel/index.html'), 'sidepanel.html')

console.log('\nBuild complete! Load the "dist" folder as an unpacked extension in Chrome.')
