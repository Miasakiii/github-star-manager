import { useState, useMemo } from 'react'
import { useStore } from '../lib/store'
import type { RepoEvent } from '../lib/db'
import { markEventRead, markAllEventsRead, db } from '../lib/db'
import { EVENT_CONFIGS } from '../lib/eventConfigs'
import { Icons } from '../lib/icons'
import { getOwner } from '../lib/utils'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (eventDay.getTime() === today.getTime()) return '今天'
  if (eventDay.getTime() === yesterday.getTime()) return '昨天'
  const weekAgo = today.getTime() - 7 * 86400000
  if (eventDay.getTime() > weekAgo) return '本周'
  const monthAgo = today.getTime() - 30 * 86400000
  if (eventDay.getTime() > monthAgo) return '本月'
  return '更早'
}

function parseEventTitle(event: RepoEvent): { repoName: string; action: string } {
  const repoName = event.repo_name
  const title = event.title
  if (title.startsWith(repoName)) {
    const action = title.slice(repoName.length).trim()
    return { repoName, action }
  }
  return { repoName, action: title }
}

export function EventList({ events }: { events: RepoEvent[] }) {
  const loadEvents = useStore(s => s.loadEvents)
  const loadRepos = useStore(s => s.loadRepos)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const handleClick = async (event: RepoEvent) => {
    if (!event.read) {
      await markEventRead(event.id)
      await loadEvents()
      await loadRepos()
    }
    window.open(event.url, '_blank', 'noopener,noreferrer')
  }

  const handleMarkAllRead = async () => {
    await markAllEventsRead()
    await loadEvents()
    await loadRepos()
  }

  const filteredEvents = useMemo(() => {
    if (filter === 'unread') return events.filter(e => !e.read)
    return events
  }, [events, filter])

  const groupedEvents = useMemo(() => {
    const groups: { label: string; items: RepoEvent[] }[] = []
    const groupMap = new Map<string, RepoEvent[]>()

    for (const event of filteredEvents) {
      const label = getDateGroup(event.created_at)
      if (!groupMap.has(label)) {
        groupMap.set(label, [])
        groups.push({ label, items: [] })
      }
      groupMap.get(label)!.push(event)
      groups.find(g => g.label === label)!.items.push(event)
    }
    return groups
  }, [filteredEvents])

  const unreadCount = events.filter(e => !e.read).length

  if (events.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#818b98] px-8 bg-[#f6f8fa]">
        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-3 border border-[#d0d7de]">
          {Icons.bell}
        </div>
        <p className="text-sm font-medium text-[#24292f]">暂无动态</p>
        <p className="text-xs text-[#818b98] mt-1 text-center">同步后将自动追踪仓库更新和新版本发布</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f6f8fa] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-white px-4 py-2.5 border-b border-[#d0d7de] flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-[#e8e9eb] text-[#24292f]'
                : 'text-[#59636e] hover:bg-[#f6f8fa]'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
              filter === 'unread'
                ? 'bg-[#e8e9eb] text-[#24292f]'
                : 'text-[#59636e] hover:bg-[#f6f8fa]'
            }`}
          >
            未读
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-[#cf222e] text-white text-[9px] font-bold rounded-full min-w-[16px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] text-[#0969da] hover:underline font-medium flex items-center gap-1"
          >
            {Icons.check}
            全部已读
          </button>
        )}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto">
        {groupedEvents.map((group) => (
          <div key={group.label}>
            <div className="sticky top-0 bg-[#f6f8fa] px-4 py-1.5 text-[11px] font-semibold text-[#59636e] border-b border-[#d0d7de]/40 z-[5]">
              {group.label}
            </div>
            {group.items.map((event) => {
              const config = EVENT_CONFIGS[event.event_type] || EVENT_CONFIGS.push
              const { repoName, action } = parseEventTitle(event)
              const owner = getOwner(event.repo_name)
              return (
                <button
                  key={event.id}
                  onClick={() => handleClick(event)}
                  className={`w-full text-left bg-white px-3 py-2.5 hover:bg-[#f6f8fa] transition-colors relative border-b border-[#d0d7de]/30 ${
                    !event.read ? 'bg-[#ddf4ff]/20' : ''
                  }`}
                >
                  {!event.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0969da]" />
                  )}
                  <div className="flex items-start gap-2.5 pl-1">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <img
                        src={`https://github.com/${owner}.png?size=40`}
                        alt={owner}
                        className="w-8 h-8 rounded-full border border-[#d0d7de]/50"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${config.bg} ${config.color} border border-white`}>
                        {config.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold truncate ${!event.read ? 'text-[#24292f]' : 'text-[#0969da]'}`}>
                          {repoName}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
                          {config.label}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed mt-0.5 ${!event.read ? 'text-[#24292f]' : 'text-[#59636e]'}`}>
                        {action}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#818b98] flex items-center gap-1">
                          {Icons.clock}
                          {timeAgo(event.created_at)}
                        </span>
                      </div>
                    </div>

                    {!event.read && (
                      <span className="w-2 h-2 bg-[#0969da] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}

        <div className="px-4 py-2 text-center text-[10px] text-[#818b98] border-t border-[#d0d7de]/30">
          共 {filteredEvents.length} 条动态
        </div>
      </div>
    </div>
  )
}
