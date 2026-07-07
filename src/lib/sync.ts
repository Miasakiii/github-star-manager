// 仓库同步模块
import { db, type Repo, type RepoEvent, setSyncMeta, getSyncMeta } from './db'
import { github } from './github'

export interface SyncProgress {
  phase: 'fetching' | 'comparing' | 'updating' | 'done'
  current: number
  total: number
  message: string
}

// 将 GitHub API 数据转换为本地 Repo 格式
function toRepo(ghRepo: any): Repo {
  return {
    id: ghRepo.id,
    full_name: ghRepo.full_name,
    owner: ghRepo.owner.login,
    owner_avatar: ghRepo.owner.avatar_url || '',
    name: ghRepo.name,
    description: ghRepo.description,
    html_url: ghRepo.html_url,
    homepage: ghRepo.homepage,
    language: ghRepo.language,
    stargazers_count: ghRepo.stargazers_count,
    forks_count: ghRepo.forks_count,
    open_issues_count: ghRepo.open_issues_count,
    topics: ghRepo.topics || [],
    created_at: ghRepo.created_at,
    updated_at: ghRepo.updated_at,
    pushed_at: ghRepo.pushed_at,
    archived: ghRepo.archived,
    disabled: ghRepo.disabled,
    visibility: ghRepo.visibility,
    tags: [],
    notes: '',
    starred_at: ghRepo.starred_at || ghRepo.updated_at,
    last_synced: new Date().toISOString(),
    has_updates: false,
    last_release_tag: null,
    last_release_at: null,
    category: 'other',
  }
}

// 全量同步星标仓库
export async function syncStarredRepos(
  onProgress?: (progress: SyncProgress) => void
): Promise<{ added: number; updated: number; removed: number }> {
  onProgress?.({ phase: 'fetching', current: 0, total: 0, message: '正在获取星标仓库列表...' })

  // 获取远程所有星标仓库
  const remoteRepos = await github.getAllStarredRepos((count) => {
    onProgress?.({ phase: 'fetching', current: count, total: 0, message: `已获取 ${count} 个仓库...` })
  })

  onProgress?.({ phase: 'comparing', current: 0, total: remoteRepos.length, message: '正在对比差异...' })

  // 获取本地已有数据
  const localRepos = await db.repos.toArray()
  const localMap = new Map(localRepos.map(r => [r.id, r]))
  const remoteMap = new Map(remoteRepos.map(r => [r.id, r]))

  let added = 0, updated = 0, removed = 0

  // 批量处理
  const batchSize = 50
  for (let i = 0; i < remoteRepos.length; i += batchSize) {
    const batch = remoteRepos.slice(i, i + batchSize)

    for (const ghRepo of batch) {
      const existing = localMap.get(ghRepo.id)

      if (!existing) {
        // 新增
        const repo = toRepo(ghRepo)
        // 保留用户自定义数据（如果之前有过）
        await db.repos.put(repo)
        added++
      } else {
        // 更新（保留用户自定义字段）
        const hasUpdates = existing.pushed_at !== ghRepo.pushed_at
        await db.repos.update(ghRepo.id, {
          description: ghRepo.description,
          owner_avatar: ghRepo.owner.avatar_url || '',
          stargazers_count: ghRepo.stargazers_count,
          forks_count: ghRepo.forks_count,
          open_issues_count: ghRepo.open_issues_count,
          topics: ghRepo.topics || [],
          updated_at: ghRepo.updated_at,
          pushed_at: ghRepo.pushed_at,
          archived: ghRepo.archived,
          disabled: ghRepo.disabled,
          last_synced: new Date().toISOString(),
          has_updates: hasUpdates,
        })

        // 记录更新事件
        if (hasUpdates && existing.pushed_at) {
          const event: RepoEvent = {
            id: `${ghRepo.id}_push_${ghRepo.pushed_at}`,
            repo_id: ghRepo.id,
            repo_name: ghRepo.full_name,
            event_type: 'push',
            title: `${ghRepo.full_name} 有新的代码推送`,
            url: ghRepo.html_url,
            created_at: ghRepo.pushed_at,
            read: false,
          }
          await db.events.put(event)
        }

        updated++
      }
    }

    onProgress?.({
      phase: 'comparing',
      current: Math.min(i + batchSize, remoteRepos.length),
      total: remoteRepos.length,
      message: `正在处理 ${Math.min(i + batchSize, remoteRepos.length)} / ${remoteRepos.length}...`,
    })
  }

  // 检查被取消星标的仓库
  for (const localRepo of localRepos) {
    if (!remoteMap.has(localRepo.id)) {
      await db.repos.delete(localRepo.id)
      removed++
    }
  }

  // 更新同步时间
  await setSyncMeta('last_sync', new Date().toISOString())
  await setSyncMeta('repo_count', String(remoteRepos.length))

  onProgress?.({ phase: 'done', current: 0, total: 0, message: '同步完成' })

  return { added, updated, removed }
}

// 检查仓库的最新 release
export async function checkReleases(repoIds?: number[]): Promise<{ newReleases: Array<{ repo_id: number; repo_name: string; tag: string; url: string }> }> {
  const repos = repoIds
    ? await Promise.all(repoIds.map(id => db.repos.get(id)))
    : (await db.repos.toArray()).filter(r => !r.archived)

  const validRepos = repos.filter(Boolean) as Repo[]
  const newReleases: Array<{ repo_id: number; repo_name: string; tag: string; url: string }> = []

  for (const repo of validRepos.slice(0, 20)) {
    try {
      const release = await github.getLatestRelease(repo.owner, repo.name)
      if (release && release.tag_name !== repo.last_release_tag) {
        await db.repos.update(repo.id, {
          last_release_tag: release.tag_name,
          last_release_at: release.published_at,
          has_updates: true,
        })

        if (repo.last_release_tag) {
          const event: RepoEvent = {
            id: `${repo.id}_release_${release.tag_name}`,
            repo_id: repo.id,
            repo_name: repo.full_name,
            event_type: 'release',
            title: `${repo.full_name} 发布了 ${release.name || release.tag_name}`,
            url: release.html_url,
            created_at: release.published_at,
            read: false,
          }
          await db.events.put(event)
          newReleases.push({ repo_id: repo.id, repo_name: repo.full_name, tag: release.tag_name, url: release.html_url })
        }
      }
    } catch {
      // 忽略单个仓库的错误
    }
  }

  // 触发 Chrome 通知
  if (newReleases.length > 0 && typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.runtime.sendMessage({ type: 'SHOW_RELEASE_NOTIFICATIONS', releases: newReleases }).catch(() => {})
  }

  return { newReleases }
}

// 获取上次同步时间
export async function getLastSyncTime(): Promise<string | null> {
  return getSyncMeta('last_sync')
}
