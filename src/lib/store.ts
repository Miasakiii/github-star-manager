// 全局状态管理 (Zustand)
import { create } from 'zustand'
import type { GitHubUser } from './github'
import type { Repo, RepoEvent } from './db'
import { db } from './db'
import { initAuth, logout as authLogout, loginWithToken } from './auth'
import { syncStarredRepos, checkReleases, getLastSyncTime } from './sync'
import { github } from './github'
import { classifyRepo, CATEGORIES, CATEGORY_LABELS } from './classify'

const hasCategories = (r: Repo): boolean => !!r.category && r.category !== 'other'

// 为没有分类的现有仓库补充分类（仅检查有无分类，避免无谓写入）
let backfillDone = false
export async function backfillCategories() {
  if (backfillDone) return
  const repos = await db.repos.toArray()
  const needsUpdate = repos.filter(r => !hasCategories(r))
  if (needsUpdate.length === 0) {
    backfillDone = true
    return
  }
  for (const repo of needsUpdate) {
    await db.repos.update(repo.id, {
      category: classifyRepo({
        topics: repo.topics,
        language: repo.language,
        description: repo.description,
      }),
    })
  }
  backfillDone = true
}

export type FilterType = 'all' | 'updates' | 'archived' | 'language' | 'tag' | 'category'
export type SortType = 'updated' | 'starred' | 'stars' | 'name' | 'pushed'

function applyFilterAndSort(
  repos: Repo[],
  filterType: FilterType,
  filterValue: string,
  sortType: SortType,
  searchQuery: string
): Repo[] {
  let filtered = [...repos]

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.topics.some(t => t.toLowerCase().includes(q)) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    )
  }

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
  user: GitHubUser | null
  isAuthenticated: boolean
  isLoading: boolean
  repos: Repo[]
  filteredRepos: Repo[]
  selectedRepo: Repo | null
  filterType: FilterType
  filterValue: string
  sortType: SortType
  searchQuery: string
  viewMode: 'all' | 'category'
  selectedCategory: string | null
  categoryStats: Record<string, number>
  stats: {
    total: number
    archived: number
    withUpdates: number
    languages: number
    unreadEvents: number
  }
  isSyncing: boolean
  syncProgress: string
  lastSyncTime: string | null
  events: RepoEvent[]

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

let messageListenerAdded = false

export const useStore = create<AppState>((set, get) => ({
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

    // 背景消息监听器只注册一次（init 在两个入口都会调用）
    if (!messageListenerAdded) {
      messageListenerAdded = true
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
    }
  },

  login: async (token: string) => {
    const user = await loginWithToken(token)
    set({ user, isAuthenticated: true })
    await get().loadRepos()
  },

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

  loadRepos: async () => {
    const repos = await db.repos.toArray()
    const total = repos.length
    const archived = repos.filter(r => r.archived).length
    const withUpdates = repos.filter(r => r.has_updates).length
    const languages = (await db.repos.orderBy('language').uniqueKeys()).length
    const allEvents = await db.events.toArray()
    const unreadEvents = allEvents.filter(e => !e.read).length

    const categoryStats: Record<string, number> = {}
    for (const cat of CATEGORIES) {
      categoryStats[cat.id] = repos.filter(r => r.category === cat.id).length
    }
    categoryStats['other'] = repos.filter(r => !r.category || r.category === 'other').length

    const stats = { total, archived, withUpdates, languages, unreadEvents }

    const state = get()
    let filtered = applyFilterAndSort(repos, state.filterType, state.filterValue, state.sortType, state.searchQuery)

    if (state.viewMode === 'category' && state.selectedCategory) {
      filtered = filtered.filter(r => r.category === state.selectedCategory)
    }

    set({ repos, filteredRepos: filtered, stats, categoryStats })
  },

  loadEvents: async () => {
    const events = await db.events.orderBy('created_at').reverse().limit(100).toArray()
    set({ events })
  },

  setSearch: (query: string) => {
    const state = get()
    const filteredRepos = applyFilterAndSort(state.repos, state.filterType, state.filterValue, state.sortType, query)
    set({ searchQuery: query, filteredRepos })
  },

  setFilter: (type: FilterType, value = '') => {
    const state = get()
    const filteredRepos = applyFilterAndSort(state.repos, type, value, state.sortType, state.searchQuery)
    set({ filterType: type, filterValue: value, filteredRepos })
  },

  setSort: (type: SortType) => {
    const state = get()
    const filteredRepos = applyFilterAndSort(state.repos, state.filterType, state.filterValue, type, state.searchQuery)
    set({ sortType: type, filteredRepos })
  },

  selectRepo: (repo: Repo | null) => {
    set({ selectedRepo: repo })
  },

  setViewMode: (mode: 'all' | 'category') => {
    set({ viewMode: mode, selectedCategory: null })
    get().loadRepos()
  },

  setSelectedCategory: (category: string | null) => {
    set({ selectedCategory: category })
    get().loadRepos()
  },

  updateTags: async (id: number, tags: string[]) => {
    await db.repos.update(id, { tags })
    await get().loadRepos()
  },

  updateNotes: async (id: number, notes: string) => {
    await db.repos.update(id, { notes })
    await get().loadRepos()
  },

  markRepoSeen: async (id: number) => {
    await db.repos.update(id, { has_updates: false })
    await get().loadRepos()
  },

  removeRepo: async (id: number) => {
    const repo = await db.repos.get(id)
    if (repo) {
      await github.unstarRepo(repo.owner, repo.name)
      await db.repos.delete(id)
      await get().loadRepos()
      set({ selectedRepo: null })
    }
  },
}))
