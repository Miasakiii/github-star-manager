// GitHub API 客户端
const GITHUB_API = 'https://api.github.com'

export interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  name: string | null
  bio: string | null
  public_repos: number
}

export interface GitHubRepo {
  id: number
  full_name: string
  owner: { login: string; avatar_url: string }
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  archived: boolean
  disabled: boolean
  visibility: string
}

export interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
}

export interface StarredRepo extends GitHubRepo {
  starred_at: string
}

// 验证仓库名称参数（防止路径遍历）
const SAFE_REPO_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/

function validateRepoParams(owner: string, repo: string): void {
  if (!owner || !repo) {
    throw new Error('Repository owner and name are required')
  }
  if (!SAFE_REPO_NAME_PATTERN.test(owner) || !SAFE_REPO_NAME_PATTERN.test(repo)) {
    throw new Error('Invalid repository owner or name format')
  }
}

class GitHubClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      ...((options.headers as Record<string, string>) || {}),
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const res = await fetch(`${GITHUB_API}${endpoint}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized')
      if (res.status === 403) {
        const reset = res.headers.get('X-RateLimit-Reset')
        throw new Error(`Rate limited. Resets: ${reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : 'unknown'}`)
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    }

    return res.json()
  }

  // 获取当前用户信息
  async getUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user')
  }

  // 获取星标仓库（分页，按 starred_at 排序）
  async getStarredRepos(page = 1, perPage = 100): Promise<StarredRepo[]> {
    const repos = await this.request<GitHubRepo[]>(`/user/starred?sort=created&direction=desc&per_page=${perPage}&page=${page}`)

    // 获取 starred_at 时间 (通过 If-None-Match header 的 starredAt)
    // GitHub API v3 不直接返回 starred_at，我们用 pushed_at 作为排序依据
    return repos.map(r => ({
      ...r,
      starred_at: r.updated_at, // 近似值
    }))
  }

  // 获取所有星标仓库（自动分页）
  async getAllStarredRepos(onProgress?: (count: number) => void): Promise<StarredRepo[]> {
    const allRepos: StarredRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const repos = await this.getStarredRepos(page, perPage)
      if (repos.length === 0) break
      allRepos.push(...repos)
      onProgress?.(allRepos.length)
      if (repos.length < perPage) break
      page++
    }

    return allRepos
  }

  // 获取仓库最新 release
  async getLatestRelease(owner: string, repo: string): Promise<GitHubRelease | null> {
    validateRepoParams(owner, repo)
    try {
      return await this.request<GitHubRelease>(`/repos/${owner}/${repo}/releases/latest`)
    } catch {
      return null // 没有 release
    }
  }

  // 获取仓库最近的 commits
  async getRecentCommits(owner: string, repo: string, limit = 5) {
    validateRepoParams(owner, repo)
    try {
      return await this.request<any[]>(`/repos/${owner}/${repo}/commits?per_page=${limit}`)
    } catch {
      return []
    }
  }

  // 获取仓库详情
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    validateRepoParams(owner, repo)
    return this.request<GitHubRepo>(`/repos/${owner}/${repo}`)
  }

  // 取消星标
  async unstarRepo(owner: string, repo: string): Promise<void> {
    validateRepoParams(owner, repo)
    await fetch(`${GITHUB_API}/user/starred/${owner}/${repo}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
  }

  // 检查认证状态
  async checkAuth(): Promise<GitHubUser | null> {
    if (!this.token) return null
    try {
      return await this.getUser()
    } catch {
      return null
    }
  }

  // 获取 API 限流信息
  async getRateLimit() {
    return this.request<any>('/rate_limit')
  }

  // 获取 README（优先中文版本）
  async getReadme(owner: string, repo: string): Promise<{ content: string; isChinese: boolean; path: string } | null> {
    validateRepoParams(owner, repo)
    // 先尝试常见的中文 README 文件名
    const chinesePaths = [
      'README_zh.md', 'README_zh_CN.md', 'README.zh.md', 'README.cn.md',
      'README_CN.md', 'README_ZH.md', 'README.zh-CN.md', 'README_zhcn.md',
      'readme_zh.md', 'README-Zh.md', 'docs/README_zh.md', 'README_zh-cn.md',
    ]

    for (const path of chinesePaths) {
      try {
        const file = await this.request<any>(`/repos/${owner}/${repo}/contents/${path}`)
        if (file.content) {
          const content = this.decodeBase64(file.content)
          return { content, isChinese: true, path }
        }
      } catch {
        continue
      }
    }

    // 获取默认 README
    try {
      const file = await this.request<any>(`/repos/${owner}/${repo}/readme`)
      if (file.content) {
        const content = this.decodeBase64(file.content)
        // 判断是否为中文（中文字符占比 > 5% 认为是中文）
        const chineseChars = content.match(/[\u4e00-\u9fa5]/g)?.length || 0
        const isChinese = content.length > 0 && chineseChars / content.length > 0.05
        return { content, isChinese, path: file.path }
      }
    } catch {
      return null
    }

    return null
  }

  // 解码 base64 为 UTF-8 字符串（修复中文乱码）
  private decodeBase64(base64: string): string {
    const binary = atob(base64.replace(/\n/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
  }

  // 翻译文本（使用 Google 翻译免费接口）
  async translateText(text: string, from = 'en', to = 'zh-CN'): Promise<string> {
    // 分段翻译（Google 翻译接口 URL 长度有限制）
    const maxLen = 1000
    const chunks: string[] = []
    let current = ''

    // 按行分段，尽量保持完整性
    const lines = text.split('\n')
    for (const line of lines) {
      if ((current + '\n' + line).length > maxLen) {
        if (current) chunks.push(current)
        if (line.length > maxLen) {
          for (let i = 0; i < line.length; i += maxLen) {
            chunks.push(line.slice(i, i + maxLen))
          }
          current = ''
        } else {
          current = line
        }
      } else {
        current = current ? current + '\n' + line : line
      }
    }
    if (current) chunks.push(current)

    const results: string[] = []
    let failed = 0
    for (const chunk of chunks) {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(chunk)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const translated = (data[0] as any[]).map((item: any) => item[0]).join('')
        if (!translated || translated === chunk) throw new Error('Translation returned original text')
        results.push(translated)
      } catch {
        failed++
        results.push('') // 占位，后续拼接时跳过
      }
    }

    // 如果全部翻译失败，抛出错误让调用方处理
    if (failed === chunks.length) {
      throw new Error('Translation failed')
    }

    return results.filter(Boolean).join('\n')
  }
}

export const github = new GitHubClient()
