const sharp = require('sharp')
const path = require('path')

async function generateIcon(size) {
  const padding = Math.round(size * 0.15)
  const starSize = size - padding * 2

  // 创建一个带圆角的深色背景 + 黄色星标 SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e293b"/>
          <stop offset="100%" style="stop-color:#0f172a"/>
        </linearGradient>
        <linearGradient id="star" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fbbf24"/>
          <stop offset="100%" style="stop-color:#f59e0b"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="${size*0.02}" stdDeviation="${size*0.03}" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" rx="${size*0.2}" fill="url(#bg)"/>
      <g transform="translate(${size/2}, ${size/2})" filter="url(#shadow)">
        <polygon points="${starPoints(0, 0, starSize*0.38, starSize*0.18)}" fill="url(#star)"/>
      </g>
      <!-- Small sparkle dots -->
      <circle cx="${size*0.72}" cy="${size*0.22}" r="${size*0.03}" fill="#60a5fa" opacity="0.7"/>
      <circle cx="${size*0.8}" cy="${size*0.35}" r="${size*0.02}" fill="#818cf8" opacity="0.5"/>
      <circle cx="${size*0.25}" cy="${size*0.75}" r="${size*0.02}" fill="#34d399" opacity="0.4"/>
    </svg>
  `

  const outputPath = path.join(__dirname, '..', 'public', `icon${size}.png`)
  await sharp(Buffer.from(svg)).png().toFile(outputPath)
  console.log(`✓ icon${size}.png generated`)
}

// 生成五角星坐标
function starPoints(cx, cy, outerR, innerR) {
  const points = []
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180
    const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180
    points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`)
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`)
  }
  return points.join(' ')
}

async function main() {
  for (const size of [16, 32, 48, 128]) {
    await generateIcon(size)
  }
  console.log('\nAll icons generated!')
}

main().catch(console.error)
