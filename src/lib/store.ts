// 全局状态管理 (Zustand)
import { create } from 'zustand'
import type { GitHubUser } from './github'
import type { Repo, RepoEvent } from './db'
import { db } from './db'
import { initAuth, logout as authLogout, loginWithToken } from './auth'
import { syncStarredRepos, checkReleases, getLastSyncTime } from './sync'
import { github } from './github'
import { classifyRepo, CATEGORIES, CATEGORY_LABELS } from './classify'

// 为没有分类的现有仓库补充分类
async function backfillCategories() {
  const repos = await db.repos.toArray()
  const needsUpdate = repos.filter(r => !r.category || r.category === 'other')
  for (const repo of needsUpdate) {
    await db.repos.update(repo.id, {
      category: classifyRepo({
        topics: repo.topics,
        language: repo.language,
        description: repo.description,
      }),
    })
  }
}

export type FilterType = 'all' | 'updates' | 'archived' | 'language' | 'tag' | 'category'
export type SortType = 'updated' | 'starred' | 'stars' | 'name' | 'pushed'

// 内部辅助函数：应用过滤和排序
function applyFilterAndSort(
  repos: Repo[],
  filterType: FilterType,
  filterValue: string,
  sortType: SortType,
  searchQuery: string
): Repo[] {
  let filtered = [...repos]

  // 搜索过滤
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.topics.some(t => t.toLowerCase().includes(q)) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  // 类型过滤
  switch (filterType) {
    case 'updates':
      filtered = filtered.filter(r => r.has_updates)
      break
    case 'archived':
      filtered = filtered.filter(r => r.archived)
      break
    case 'language':
      if (filterValue) filtered = filtered.filter(r => r.language === filterValue)
      break
    case 'tag':
      if (filterValue) filtered = filtered.filter(r => r.tags.includes(filterValue))
      break
    case 'category':
      if (filterValue) filtered = filtered.filter(r => r.category === filterValue)
      break
  }

  // 排序
  switch (sortType) {
    case 'updated':
      filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      break
    case 'pushed':
      filtered.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      break
    case 'starred':
      filtered.sort((a, b) => new Date(b.starred_at).getTime() - new Date(a.starred_at).getTime())
      break
    case 'stars':
      filtered.sort((a, b) => b.stargazers_count - a.stargazers_count)
      break
    case 'name':
      filtered.sort((a, b) => a.full_name.localeCompare(b.full_name))
      break
  }

  return filtered
}

interface AppState {
  // 认证
  user: GitHubUser | null
  isAuthenticated: boolean
  isLoading: boolean

  // 仓库数据
  repos: Repo[]
  filteredRepos: Repo[]
  selectedRepo: Repo | null

  // 过滤与排序
  filterType: FilterType
  filterValue: string
  sortType: SortType
  searchQuery: string

  // 分类视图
  viewMode: 'all' | 'category'
  selectedCategory: string | null
  categoryStats: Record<string, number>

  // 统计
  stats: {
    total: number
    archived: number
    withUpdates: number
    languages: number
    unreadEvents: number
  }

  // 同步状态
  isSyncing: boolean
  syncProgress: string
  lastSyncTime: string | null

  // 事件
  events: RepoEvent[]

  // Actions
  init: () => Promise<void>
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  sync: () => Promise<void>
  loadRepos: () => Promise<void>
  loadEvents: () => Promise<void>
  setSearch: (query: string) => void
  setFilter: (type: FilterType, value?: string) => void
  setSort: (type: SortType) => void
  selectRepo: (repo: Repo | null) => void
  setViewMode: (mode: 'all' | 'category') => void
  setSelectedCategory: (category: string | null) => void
  updateTags: (id: number, tags: string[]) => Promise<void>
  updateNotes: (id: number, notes: string) => Promise<void>
  markRepoSeen: (id: number) => Promise<void>
  removeRepo: (id: number) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  user: null,
  isAuthenticated: false,
  isLoading: true,
  repos: [],
  filteredRepos: [],
  selectedRepo: null,
  filterType: 'all',
  filterValue: '',
  sortType: 'pushed',
  searchQuery: '',
  viewMode: 'all',
  selectedCategory: null,
  categoryStats: {},
  stats: { total: 0, archived: 0, withUpdates: 0, languages: 0, unreadEvents: 0 },
  isSyncing: false,
  syncProgress: '',
  lastSyncTime: null,
  events: [],

  // 初始化
  init: async () => {
    set({ isLoading: true })
    try {
      const user = await initAuth()
      if (user) {
        set({ user, isAuthenticated: true })
        await get().loadRepos()
        await get().loadEvents()
        await backfillCategories()
        const lastSync = await getLastSyncTime()
        set({ lastSyncTime: lastSync })
      }
    } catch (e) {
      console.error('Init failed:', e)
    } finally {
      set({ isLoading: false })
    }

    // 监听后台同步消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TRIGGER_SYNC' && get().isAuthenticated) {
        get().sync()
      }
      if (message.type === 'CHECK_RELEASES' && get().isAuthenticated) {
        checkReleases().then(() => {
          get().loadRepos()
          get().loadEvents()
        })
      }
    })
  },

  // 登录
  login: async (token: string) => {
    const user = await loginWithToken(token)
    set({ user, isAuthenticated: true })
    await get().loadRepos()
  },

  // 登出
  logout: async () => {
    await authLogout()
    set({
      user: null,
      isAuthenticated: false,
      repos: [],
      filteredRepos: [],
      selectedRepo: null,
      events: [],
    })
  },

  // 同步
  sync: async () => {
    set({ isSyncing: true, syncProgress: '开始同步...' })
    try {
      await syncStarredRepos((progress) => {
        set({ syncProgress: progress.message })
      })
      set({ syncProgress: '检查新版本...' })
      await checkReleases()
      await get().loadRepos()
      await get().loadEvents()
      const lastSync = await getLastSyncTime()
      set({ lastSyncTime: lastSync })
    } catch (e) {
      console.error('Sync failed:', e)
      set({ syncProgress: `同步失败: ${(e as Error).message}` })
    } finally {
      set({ isSyncing: false })
    }
  },

  // 加载仓库列表
  loadRepos: async () => {
    const repos = await db.repos.toArray()
    const total = repos.length
    const archived = repos.filter(r => r.archived).length
    const withUpdates = repos.filter(r => r.has_updates).length
    const languages = (await db.repos.orderBy('language').uniqueKeys()).length
    const allEvents = await db.events.toArray()
    const unreadEvents = allEvents.filter(e => !e.read).length

    // 计算分类统计
    const categoryStats: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      categoryStats[cat.id] = repos.filter(r => r.category === cat.id).length
    }
    categoryStats['other'] = repos.filter(r => !r.category || r.category === 'other').length

    const stats = { total, archived, withUpdates, languages, unreadEvents }

    const state = get()
    let filtered = applyFilterAndSort(repos, state.filterType, state.filterValue, state.sortType, state.searchQuery)

    // 分类视图过滤
    if (state.viewMode === 'category' && state.selectedCategory) {
      filtered = filtered.filter(r => r.category === state.selectedCategory)
    }

    set({ repos, filteredRepos: filtered, stats, categoryStats })
  },

  // 加载事件
  loadEvents: async () => {
    const events = await db.events.orderBy('created_at').reverse().limit(100).toArray()
    set({ events })
  },

  // 搜索
  setSearch: (query: string) => {
    const state = get()
    const filteredRepos = applyFilterAndSort(state.repos, state.filterType, state.filterValue, state.sortType, query)
    set({ searchQuery: query, filteredRepos })
  },

  // 设置过滤
  setFilter: (type: FilterType, value = '') => {
    const state = get()
    const filteredRepos = applyFilterAndSort(state.repos, type, value, state.sortType, state.searchQuery)
    set({ filterType: type, filterValue: value, filteredRepos })
  },

  // 设置排序
  setSort: (type: SortType) => {
    const state = get()
    const filteredRepos = applyFilterAndSort(state.repos, state.filterType, state.filterValue, type, state.searchQuery)
    set({ sortType: type, filteredRepos })
  },

  // 选择仓库
  selectRepo: (repo) => set({ selectedRepo: repo }),

  // 设置视图模式
  setViewMode: (mode) => {
    set({ viewMode: mode, selectedCategory: null })
    get().loadRepos()
  },

  // 设置选中的分类
  setSelectedCategory: (category) => {
    set({ selectedCategory: category })
    get().loadRepos()
  },

  // 更新标签
  updateTags: async (id, tags) => {
    await db.repos.update(id, { tags })
    await get().loadRepos()
  },

  // 更新备注
  updateNotes: async (id, notes) => {
    await db.repos.update(id, { notes })
    await get().loadRepos()
  },

  // 标记仓库已读
  markRepoSeen: async (id) => {
    await db.repos.update(id, { has_updates: false })
    await get().loadRepos()
  },

  // 取消星标
  removeRepo: async (id) => {
    const repo = await db.repos.get(id)
    if (repo) {
      await github.unstarRepo(repo.owner, repo.name)
      await db.repos.delete(id)
      await get().loadRepos()
      set({ selectedRepo: null })
    }
  },
}))
