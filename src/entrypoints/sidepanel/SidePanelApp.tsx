import { useEffect, useState, useMemo } from 'react'
import { useStore } from '../../lib/store'
import { LoginScreen } from '../../components/LoginScreen'
import { CATEGORY_LABELS } from '../../lib/classify'
import { Icons } from '../../lib/icons'
import { safeAvatarUrl, timeAgoShort, formatStars, LANGUAGE_COLORS } from '../../lib/utils'
import { useDebounce } from '../../lib/useDebounce'

export function SidePanelApp() {
  const {
    isAuthenticated, isLoading, user, repos, filteredRepos,
    stats, isSyncing, syncProgress, lastSyncTime,
    searchQuery, sortType,
    viewMode, selectedCategory, categoryStats,
    init, sync, setSort, setFilter, selectRepo,
    setViewMode, setSelectedCategory,
  } = useStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const debouncedSearch = useDebounce(searchInput, 200, useStore.getState().setSearch)
  const selectedRepo = repos.find(r => r.id === selectedId)

  // Sync local input when store query changes externally
  useEffect(() => {
    if (searchQuery !== searchInput) setSearchInput(searchQuery)
  }, [searchQuery])

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
        {/* Header */}
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
                Icons.sync
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
                  {Icons.back}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818b98]">{Icons.search}</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all placeholder:text-[#818b98]"
                />
              </div>
            </div>
            {/* Repo List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#818b98] px-6">
                  <span className="text-[#818b98]">{Icons.emptyInbox}</span>
                  <p className="text-xs text-center mt-2">没有匹配的仓库</p>
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
                          src={safeAvatarUrl(repo.owner, repo.owner_avatar)}
                          alt={repo.owner}
                          className="w-6 h-6 rounded-md flex-shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://github.com/${repo.owner}.png?size=80` }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#0969da] truncate">{repo.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {repo.language && <span className="text-[10px] text-[#59636e]">{repo.language}</span>}
                            <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
                              <span className="text-[#818b98]">{Icons.star}</span>
                              {formatStars(repo.stargazers_count)}
                            </span>
                            <span className="text-[10px] text-[#818b98]">{timeAgoShort(repo.pushed_at)}</span>
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
                  <span className="text-[#818b98]">{Icons.star}</span>
                  {selectedRepo.stargazers_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                  <span className="text-[#818b98]">{Icons.fork}</span>
                  {selectedRepo.forks_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                  <span className="text-[#818b98]">{Icons.info}</span>
                  {selectedRepo.open_issues_count}
                </span>
                {selectedRepo.language && (
                  <span className="flex items-center gap-1.5 text-sm text-[#59636e]">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[selectedRepo.language] || '#999' }} />
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
                  {Icons.externalLink}
                  在 GitHub 打开
                </a>
                {selectedRepo.homepage && (
                  <a
                    href={selectedRepo.homepage}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-2 px-4 py-2 bg-[#f6f8fa] text-[#24292f] rounded-md text-sm font-medium hover:bg-[#f3f4f6] transition-colors border border-[#d0d7de]"
                  >
                    {Icons.globe}
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
                  { label: '最后推送', value: timeAgoShort(selectedRepo.pushed_at) + ' 前' },
                  { label: '最后同步', value: timeAgoShort(selectedRepo.last_synced) + ' 前' },
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
                    {Icons.info}
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
              {Icons.emptyInbox}
            </div>
            <p className="text-sm font-medium text-[#59636e]">从左侧选择一个仓库</p>
            <p className="text-xs text-[#818b98] mt-1">查看详情、提交记录和版本信息</p>
          </div>
        )}
      </div>
    </div>
  )
}
