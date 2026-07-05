// 轻量级 Markdown 渲染器（安全：先转义 HTML 再处理 Markdown 语法）
export function renderMarkdown(md: string): string {
  // 先转义 HTML 特殊字符，防止 XSS
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 代码块（```lang\ncode```）
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre class="md-pre"><code>${code.trim()}</code></pre>`
  })

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')

  // 标题
  html = html.replace(/^###### (.+)$/gm, '<h6 class="md-h">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 class="md-h">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h">$1</h1>')

  // 水平线
  html = html.replace(/^---+$/gm, '<hr class="md-hr"/>')

  // 图片（只允许 http/https 协议）
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => {
    if (/^https?:\/\//i.test(url)) {
      return `<img src="${url}" alt="${alt}" class="md-img"/>`
    }
    return alt
  })

  // 链接（只允许 http/https 协议）
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    if (/^https?:\/\//i.test(url)) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="md-a">${text}</a>`
    }
    return text
  })

  // 粗体
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 斜体（避免匹配粗体的 **）
  html = html.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3')

  // 引用
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-quote">$1</blockquote>')

  // 无序列表项
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')

  // 有序列表项
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')

  // 包裹连续的 li 为 ul
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="md-ul">${m}</ul>`)

  // 段落（非标签行包裹 p）
  html = html.replace(/^(?!<[hupolb]|<hr|<img|<pre|<blockquote)(.+)$/gm, '<p class="md-p">$1</p>')

  // 清理多余空行
  html = html.replace(/\n{3,}/g, '\n\n')

  return html
}
