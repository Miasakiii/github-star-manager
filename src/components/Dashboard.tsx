import { useState, useEffect, useCallback } from 'react'
import { useStore, type SortType } from '../lib/store'
import { RepoCard } from './RepoCard'
import { StatsBar } from './StatsBar'
import { FilterBar } from './FilterBar'
import { EventList } from './EventList'
import { Icons } from '../lib/icons'
import { timeSince } from '../lib/utils'
import { useDebounce } from '../lib/useDebounce'

export function Dashboard() {
  const {
    user,
    filteredRepos,
    isSyncing,
    syncProgress,
    lastSyncTime,
    searchQuery,
    sortType,
    events,
    sync,
    setSort,
    logout,
    loadEvents,
  } = useStore()

  const [searchInput, setSearchInput] = useState(searchQuery)
  const debouncedSearch = useDebounce(searchInput, 200, useStore.getState().setSearch)
  const [view, setView] = useState<'repos' | 'events'>('repos')
  const [showMenu, setShowMenu] = useState(false)

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'pushed', label: '最近推送' },
    { value: 'updated', label: '最近更新' },
    { value: 'starred', label: '最近星标' },
    { value: 'stars', label: '最多星标' },
    { value: 'name', label: '名称排序' },
  ]

  // Sync local input when store query changes externally
  useEffect(() => {
    if (searchQuery !== searchInput) setSearchInput(searchQuery)
  }, [searchQuery])

  return (
    <div className="w-[440px] h-[600px] flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-[#24292f] px-4 py-3 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">Star Manager</span>
              <p className="text-[10px] text-[#8b949e] -mt-0.5">GitHub 星标仓库管理</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => sync()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded-md text-xs transition-colors disabled:opacity-50 border border-white/10"
              title="同步仓库"
            >
              {isSyncing ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                Icons.sync
              )}
              {isSyncing ? '同步中' : '同步'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 rounded-md overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
              >
                <img src={user?.avatar_url} alt="" className="w-full h-full object-cover" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg border border-[#d0d7de] py-1 w-40 z-50 animate-fade-in-scale">
                    <div className="px-3 py-2 border-b border-[#d0d7de]/40">
                      <p className="text-xs font-semibold text-[#24292f] truncate">{user?.login}</p>
                      {user?.name && <p className="text-[10px] text-[#59636e] truncate">{user.name}</p>}
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-xs text-[#cf222e] hover:bg-[#f6f8fa] flex items-center gap-2 transition-colors"
                    >
                      {Icons.logOut}
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sync progress */}
        {isSyncing && (
          <div className="flex items-center gap-2 mb-2 animate-fade-in">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#2da44e] rounded-full animate-shimmer" style={{ width: '60%' }} />
            </div>
            <span className="text-[10px] text-[#8b949e] flex-shrink-0">{syncProgress}</span>
          </div>
        )}

        {/* Stats */}
        <StatsBar />
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#d0d7de] flex-shrink-0 bg-white">
        {[
          { key: 'repos' as const, label: '仓库列表', count: filteredRepos.length },
          { key: 'events' as const, label: '动态', count: events.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); if (tab.key === 'events') loadEvents() }}
            className={`flex-1 py-2.5 text-xs font-medium transition-all relative flex items-center justify-center gap-1.5 ${
              view === tab.key ? 'text-[#24292f] border-b-2 border-[#fd8c73]' : 'text-[#59636e] hover:text-[#24292f] border-b-2 border-transparent'
            }`}
          >
            {tab.label}
            {tab.key === 'events' && tab.count > 0 && (
              <span className="px-1.5 py-0.5 bg-[#cf222e] text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === 'repos' ? (
        <>
          {/* Search & Sort */}
          <div className="px-3 py-2 border-b border-[#d0d7de]/40 flex-shrink-0 space-y-2 bg-[#f6f8fa]/50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#818b98]">{Icons.search}</span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索仓库、描述、标签..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#d0d7de] rounded-md text-xs focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all placeholder:text-[#818b98]"
                />
              </div>
              <select
                value={sortType}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-2 py-1.5 bg-white border border-[#d0d7de] rounded-md text-xs text-[#24292f] focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all appearance-none pr-7 cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23596699' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 6px center',
                }}
              >
                {sortOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <FilterBar />
          </div>

          {/* Repo List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#818b98] px-8">
                <div className="w-14 h-14 bg-[#f6f8fa] rounded-xl flex items-center justify-center mb-3">
                  {searchQuery ? (
                    <span className="text-[#818b98]">{Icons.search}</span>
                  ) : (
                    <span className="text-[#818b98]">{Icons.emptyInbox}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-[#59636e]">
                  {searchQuery ? '没有匹配的仓库' : '还没有星标仓库'}
                </p>
                <p className="text-xs text-[#818b98] mt-1 text-center">
                  {searchQuery ? '试试其他关键词' : '点击同步按钮获取你的星标仓库'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => sync()}
                    className="mt-3 px-4 py-1.5 bg-[#1f883d] text-white rounded-md text-xs font-medium hover:bg-[#1a7f37] transition-colors"
                  >
                    立即同步
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filteredRepos.map(repo => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-1.5 border-t border-[#d0d7de] text-[10px] text-[#59636e] flex-shrink-0 bg-[#f6f8fa]/50">
            <div className="flex items-center justify-between">
              <span>共 {filteredRepos.length} 个仓库</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white rounded text-[9px] font-mono border border-[#d0d7de]">Alt+S</kbd>
                  <span>打开</span>
                </span>
                <span className="flex items-center gap-1">
                  {Icons.clock}
                  {timeSince(lastSyncTime)}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <EventList events={events} />
      )}
    </div>
  )
}
