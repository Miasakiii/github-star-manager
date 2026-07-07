import { useEffect, useState, useMemo } from 'react'
import { useStore } from '../../lib/store'
import { LoginScreen } from '../../components/LoginScreen'
import { CATEGORY_LABELS } from '../../lib/classify'

const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export function SidePanelApp() {
  const {
    isAuthenticated, isLoading, user, repos, filteredRepos,
    stats, isSyncing, syncProgress, lastSyncTime,
    searchQuery, sortType,
    viewMode, selectedCategory, categoryStats,
    init, sync, setSearch, setSort, setFilter, selectRepo,
    setViewMode, setSelectedCategory,
  } = useStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedRepo = repos.find(r => r.id === selectedId)

  useEffect(() => { init() }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#0969da] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#818b98]">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left: Repo List */}
      <div className="w-80 border-r border-[#d0d7de] flex flex-col flex-shrink-0 bg-white">
        {/* Header - GitHub dark */}
        <div className="bg-[#24292f] text-white px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              <span className="font-bold text-sm">Star Manager</span>
            </div>
            <button
              onClick={() => sync()}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/15 rounded-md text-xs transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              )}
              同步
            </button>
          </div>
          {isSyncing && <p className="text-[10px] text-[#8b949e] truncate">{syncProgress}</p>}
          <div className="flex items-center gap-3 text-[11px] text-[#8b949e] mt-1">
            <span>{stats.total} 仓库</span>
            <span>·</span>
            <span className="text-[#2da44e]">{stats.withUpdates} 有更新</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex border-b border-[#d0d7de] flex-shrink-0">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              viewMode === 'all'
                ? 'text-[#0969da] border-b-2 border-[#0969da] bg-white'
                : 'text-[#59636e] hover:bg-[#f6f8fa]'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              viewMode === 'category'
                ? 'text-[#0969da] border-b-2 border-[#0969da] bg-white'
                : 'text-[#59636e] hover:bg-[#f6f8fa]'
            }`}
          >
            分类
          </button>
        </div>

        {/* Category List or Repo List */}
        {viewMode === 'category' && !selectedCategory ? (
          <div className="flex-1 overflow-y-auto">
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className="w-full text-left px-4 py-3 hover:bg-[#f6f8fa] transition-colors border-b border-[#d0d7de]/30 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-[#24292f]">{label}</span>
                <span className="text-[10px] text-[#818b98] bg-[#f6f8fa] px-2 py-0.5 rounded-full">
                  {categoryStats[id] || 0}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* Back button when in category view */}
            {viewMode === 'category' && selectedCategory && (
              <div className="px-3 py-2 border-b border-[#d0d7de] flex-shrink-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 text-xs text-[#0969da] hover:text-[#0550ae]"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回分类
                </button>
                <p className="text-[10px] text-[#818b98] mt-1">
                  {CATEGORY_LABELS[selectedCategory]} ({filteredRepos.length})
                </p>
              </div>
            )}
            {/* Search */}
            <div className="px-3 py-2 border-b border-[#d0d7de] flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all placeholder:text-[#818b98]"
                />
              </div>
            </div>
            {/* Repo List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#818b98] px-6">
                  <svg className="w-8 h-8 mb-2 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5l-2 3h-2l-2-3H4" /></svg>
                  <p className="text-xs text-center">没有匹配的仓库</p>
                </div>
              ) : (
                <div>
                  {filteredRepos.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => setSelectedId(repo.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-[#f6f8fa] transition-colors border-b border-[#d0d7de]/30 ${
                        selectedId === repo.id ? 'bg-[#ddf4ff] border-l-2 border-l-[#0969da]' : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={repo.owner_avatar || `https://github.com/${repo.owner}.png?size=80`}
                          alt={repo.owner}
                          className="w-6 h-6 rounded-md flex-shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://github.com/${repo.owner}.png?size=80` }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#0969da] truncate">{repo.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {repo.language && <span className="text-[10px] text-[#59636e]">{repo.language}</span>}
                            <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
                              <svg className="w-2.5 h-2.5 text-[#818b98]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              {formatStars(repo.stargazers_count)}
                            </span>
                            <span className="text-[10px] text-[#818b98]">{timeAgo(repo.pushed_at)}</span>
                          </div>
                        </div>
                        {repo.has_updates && (
                          <span className="w-2 h-2 bg-[#2da44e] rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Detail */}
      <div className="flex-1 flex flex-col bg-[#f6f8fa]">
        {selectedRepo ? (
          <>
            {/* Header */}
            <div className="bg-white px-6 py-5 border-b border-[#d0d7de]">
              <div className="flex items-center gap-3 mb-2">
                {selectedRepo.owner_avatar ? (
                  <img src={selectedRepo.owner_avatar} alt={selectedRepo.owner} className="w-10 h-10 rounded-lg" />
                ) : (
                  <img src={`https://github.com/${selectedRepo.owner}.png?size=80`} alt={selectedRepo.owner} className="w-10 h-10 rounded-lg" />
                )}
                <h2 className="text-xl font-bold text-[#24292f] tracking-tight">{selectedRepo.full_name}</h2>
              </div>
              {selectedRepo.description && (
                <p className="text-sm text-[#59636e] mt-1 leading-relaxed">{selectedRepo.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                  <svg className="w-4 h-4 text-[#818b98]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  {selectedRepo.stargazers_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                  <svg className="w-4 h-4 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a1.99 1.99 0 010 2.828l-7 7a1.99 1.99 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>
                  {selectedRepo.forks_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                  <svg className="w-4 h-4 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  {selectedRepo.open_issues_count}
                </span>
                {selectedRepo.language && (
                  <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: languageColors[selectedRepo.language] || '#999' }} />
                    {selectedRepo.language}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={selectedRepo.html_url}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1f883d] text-white rounded-md text-sm font-medium hover:bg-[#1a7f37] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  在 GitHub 打开
                </a>
                {selectedRepo.homepage && (
                  <a
                    href={selectedRepo.homepage}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-2 px-4 py-2 bg-[#f6f8fa] text-[#24292f] rounded-md text-sm font-medium hover:bg-[#f3f4f6] transition-colors border border-[#d0d7de]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    主页
                  </a>
                )}
              </div>

              {/* Topics */}
              {selectedRepo.topics.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#59636e] mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRepo.topics.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-[#ddf4ff] text-[#0969da] text-xs font-medium rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '创建时间', value: new Date(selectedRepo.created_at).toLocaleDateString('zh-CN') },
                  { label: '最后推送', value: timeAgo(selectedRepo.pushed_at) + ' 前' },
                  { label: '最后同步', value: timeAgo(selectedRepo.last_synced) + ' 前' },
                  ...(selectedRepo.last_release_tag ? [{ label: '最新版本', value: selectedRepo.last_release_tag }] : []),
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-md p-3 border border-[#d0d7de]">
                    <p className="text-[10px] text-[#818b98] mb-0.5">{item.label}</p>
                    <p className="text-xs font-medium text-[#24292f]">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selectedRepo.notes && (
                <div className="p-4 bg-[#fff8c5] rounded-md border border-[#eac54a]/30">
                  <h4 className="text-xs font-semibold text-[#7d4e00] mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    备注
                  </h4>
                  <p className="text-sm text-[#7d4e00] leading-relaxed">{selectedRepo.notes}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#818b98]">
            <div className="w-16 h-16 bg-[#f6f8fa] rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <p className="text-sm font-medium text-[#59636e]">从左侧选择一个仓库</p>
            <p className="text-xs text-[#818b98] mt-1">查看详情、提交记录和版本信息</p>
          </div>
        )}
      </div>
    </div>
  )
}
