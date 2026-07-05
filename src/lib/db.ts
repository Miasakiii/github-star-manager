import Dexie, { type EntityTable } from 'dexie'

// 仓库数据结构
export interface Repo {
  id: number                    // GitHub repo ID
  full_name: string             // owner/repo
  owner: string
  owner_avatar: string
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
  // 自定义字段
  tags: string[]                // 用户自定义标签
  notes: string                 // 用户备注
  starred_at: string            // 星标时间
  last_synced: string           // 最后同步时间
  has_updates: boolean          // 是否有更新
  last_release_tag: string | null
  last_release_at: string | null
}

// 动态事件
export interface RepoEvent {
  id: string                    // repo_id + event_type + timestamp
  repo_id: number
  repo_name: string
  event_type: 'release' | 'push' | 'issue' | 'pr' | 'star' | 'fork' | 'archived'
  title: string
  url: string
  created_at: string
  read: boolean
}

// 同步元数据
export interface SyncMeta {
  key: string
  value: string
}

// 数据库实例
const db = new Dexie('GitHubStarManager') as Dexie & {
  repos: EntityTable<Repo, 'id'>
  events: EntityTable<RepoEvent, 'id'>
  syncMeta: EntityTable<SyncMeta, 'key'>
}

db.version(1).stores({
  repos: 'id, full_name, owner, language, stargazers_count, pushed_at, archived, *tags, has_updates',
  events: 'id, repo_id, event_type, created_at, read',
  syncMeta: 'key',
})

// v2: 移除布尔值字段的无效索引（IndexedDB 不支持布尔键），tags 多值索引保留
db.version(2).stores({
  repos: 'id, full_name, owner, language, stargazers_count, pushed_at, *tags',
  events: 'id, repo_id, event_type, created_at',
  syncMeta: 'key',
})

export { db }

// 工具函数
export async function getSyncMeta(key: string): Promise<string | null> {
  const meta = await db.syncMeta.get(key)
  return meta?.value ?? null
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  await db.syncMeta.put({ key, value })
}

export async function getRepos(): Promise<Repo[]> {
  return db.repos.orderBy('pushed_at').reverse().toArray()
}

export async function getRepoById(id: number): Promise<Repo | undefined> {
  return db.repos.get(id)
}

export async function getReposByLanguage(lang: string): Promise<Repo[]> {
  return db.repos.where('language').equals(lang).toArray()
}

export async function getReposWithTag(tag: string): Promise<Repo[]> {
  return db.repos.where('tags').equals(tag).toArray()
}

export async function getUnreadEvents(): Promise<RepoEvent[]> {
  const all = await db.events.toArray()
  return all.filter(e => !e.read).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getRecentEvents(limit = 50): Promise<RepoEvent[]> {
  return db.events.orderBy('created_at').reverse().limit(limit).toArray()
}

export async function markEventRead(id: string): Promise<void> {
  await db.events.update(id, { read: true })
}

export async function markAllEventsRead(): Promise<void> {
  const all = await db.events.toArray()
  const unread = all.filter(e => !e.read)
  await db.events.bulkPut(unread.map(e => ({ ...e, read: true })))
}

export async function updateRepoTags(id: number, tags: string[]): Promise<void> {
  await db.repos.update(id, { tags })
}

export async function updateRepoNotes(id: number, notes: string): Promise<void> {
  await db.repos.update(id, { notes })
}

export async function searchRepos(query: string): Promise<Repo[]> {
  const q = query.toLowerCase()
  const all = await db.repos.toArray()
  return all.filter(r =>
    r.full_name.toLowerCase().includes(q) ||
    r.description?.toLowerCase().includes(q) ||
    r.topics.some(t => t.toLowerCase().includes(q)) ||
    r.tags.some(t => t.toLowerCase().includes(q)) ||
    r.notes?.toLowerCase().includes(q)
  )
}

export async function getStats() {
  const all = await db.repos.toArray()
  const total = all.length
  const archived = all.filter(r => r.archived).length
  const withUpdates = all.filter(r => r.has_updates).length
  const languages = await db.repos.orderBy('language').uniqueKeys()
  const allEvents = await db.events.toArray()
  const unreadEvents = allEvents.filter(e => !e.read).length
  return { total, archived, withUpdates, languages: languages.length, unreadEvents }
}
