// 自动分类模块 — 基于仓库元数据的关键词规则引擎

export interface CategoryRule {
  id: string
  label: string
  keywords: string[]
  priority: number  // 越小优先级越高（平局时使用）
}

export const CATEGORIES: CategoryRule[] = [
  {
    id: 'frontend',
    label: '前端框架/UI',
    keywords: ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'tailwind', 'css', 'html', 'ui', 'component', 'frontend', 'web-components', 'design-system'],
    priority: 1,
  },
  {
    id: 'backend',
    label: '后端框架/服务端',
    keywords: ['express', 'fastify', 'nestjs', 'django', 'flask', 'spring', 'laravel', 'graphql', 'rest-api', 'backend', 'api', 'server', 'grpc'],
    priority: 2,
  },
  {
    id: 'ai-ml',
    label: 'AI/ML/数据',
    keywords: ['machine-learning', 'deep-learning', 'neural-network', 'llm', 'ai', 'ml', 'data-science', 'pytorch', 'tensorflow', 'nlp', 'computer-vision', 'gpt', 'transformer', 'diffusion'],
    priority: 3,
  },
  {
    id: 'devops',
    label: 'DevOps/基础设施',
    keywords: ['docker', 'kubernetes', 'terraform', 'ansible', 'ci-cd', 'github-actions', 'aws', 'azure', 'gcp', 'cloud', 'devops', 'infrastructure', 'monitoring', 'prometheus'],
    priority: 4,
  },
  {
    id: 'mobile',
    label: '移动端',
    keywords: ['ios', 'android', 'react-native', 'flutter', 'swift', 'kotlin', 'mobile-app', 'expo', 'xamarin', 'cordova'],
    priority: 5,
  },
  {
    id: 'tools',
    label: '工具库',
    keywords: ['cli', 'utility', 'helper', 'tool', 'library', 'sdk', 'package', 'npm', 'pip', 'cargo', 'benchmark', 'testing'],
    priority: 6,
  },
  {
    id: 'docs',
    label: '文档/教程',
    keywords: ['tutorial', 'documentation', 'learning', 'course', 'book', 'awesome', 'cheat-sheet', 'roadmap', 'example', 'sample'],
    priority: 7,
  },
]

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.label])
)
CATEGORY_LABELS['other'] = '其他'

// 匹配计数：统计仓库元数据中有多少关键词命中
function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  return keywords.filter(kw => lower.includes(kw)).length
}

// 分类一个仓库，返回分类 ID
export function classifyRepo(repo: {
  topics: string[]
  language: string | null
  description: string | null
}): string {
  const topicText = repo.topics.join(' ')
  const langText = repo.language || ''
  const descText = repo.description || ''
  const combined = `${topicText} ${langText} ${descText}`

  let bestCategory: string = 'other'
  let bestScore = 0
  let bestPriority = Infinity

  for (const category of CATEGORIES) {
    const score = countMatches(combined, category.keywords)
    if (score > 0) {
      if (score > bestScore || (score === bestScore && category.priority < bestPriority)) {
        bestScore = score
        bestCategory = category.id
        bestPriority = category.priority
      }
    }
  }

  return bestCategory
}
