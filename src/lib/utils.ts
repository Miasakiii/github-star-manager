// 轻量级 Markdown 渲染器（安全：先转义 HTML 再处理 Markdown 语法）
export function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="md-pre"><code>${code.trim()}</code></pre>`
  })
  html = html.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  html = html.replace(/^###### (.+)$/gm, '<h6 class="md-h">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 class="md-h">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h">$1</h1>')
  html = html.replace(/^---+$/gm, '<hr class="md-hr"/>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    if (/^https?:\/\//i.test(url)) {
      return `<img src="${url}" alt="${alt}" class="md-img"/>`
    }
    return alt
  })
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    if (/^https?:\/\//i.test(url)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-a">${text}</a>`
    }
    return text
  })
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3')
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>')
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="md-ul">${m}</ul>`)
  html = html.replace(/^(?!<[hupolb]|<hr|<img|<pre|<blockquote)(.+)$/gm, '<p class="md-p">$1</p>')
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}

// 语言颜色映射（GitHub 风格）
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', Vue: '#41b883', Shell: '#89e051', HTML: '#e34c26',
  CSS: '#563d7c', Lua: '#000080', Zig: '#ec915c', Svelte: '#ff3e00',
  Jupyter: '#DA5B0B',
}

// 时间格式化 — 简短模式（卡片用）
export function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

// 时间格式化 — 完整模式（详情用）
export function timeAgoFull(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

// 时间格式化 — 同步进度用（含"天前"）
export function timeSince(dateStr: string | null): string {
  if (!dateStr) return '从未'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// 数字格式化
export function formatStars(count: number): string {
  if (count >= 10000) return `${(count / 1000).toFixed(0)}k`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toLocaleString()
}

// 检测文本是否包含中文
export function isChineseText(text: string): boolean {
  const chineseChars = text.match(/[一-龥]/g)?.length || 0
  return text.length > 0 && chineseChars / text.length > 0.05
}

// 安全的 GitHub avatar URL
export function safeAvatarUrl(owner: string, avatar?: string | null): string {
  if (avatar && avatar !== 'https://github.com/images/error/octocat@.gif') {
    return avatar
  }
  return `https://github.com/${owner}.png?size=80`
}

// 从 "owner/repo" 格式提取 owner
export function getOwner(repoName: string): string {
  return repoName.split('/')[0] || repoName
}
