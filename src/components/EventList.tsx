import type { RepoEvent } from '../lib/db'
import { markEventRead, markAllEventsRead, db } from '../lib/db'
import { useStore } from '../lib/store'
import { useState, useMemo } from 'react'

// GitHub-style event type config with Octicon-like SVGs
const eventConfig: Record<string, { icon: JSX.Element; color: string; bg: string; label: string }> = {
  release: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 7.775V2.75a.25.25 0 0 1 .25-.25h5.025a3.5 3.5 0 0 0 2.317-.876L11.5.5 9.408 1.624A3.5 3.5 0 0 0 7.091.75H2.75A1.75 1.75 0 0 0 1 2.5v5.275c0 .273.06.54.174.786L3.5 13.5l2.326-4.94a3.5 3.5 0 0 0 .174-.785Zm11.5 4.25V4.225a3.5 3.5 0 0 0-2.317.876L9.5 6.5l2.092-1.124A3.5 3.5 0 0 0 13.908 4.5H15a.25.25 0 0 1 .25.25v6.775a3.5 3.5 0 0 0-1-.876L12.5 13.5l-1.75-1.85a3.5 3.5 0 0 0-2.317-.876H6.5l3.317 1.124A3.5 3.5 0 0 0 12.5 13.5l2.326-1.5a3.5 3.5 0 0 1-1 .876Z" /></svg>,
    color: 'text-[#1a7f37]', bg: 'bg-[#dafbe1]', label: 'Release',
  },
  push: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.75C4 .784 4.784 0 5.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 15h-3.5a.75.75 0 0 1 0-1.5h3.5a.25.25 0 0 0 .25-.25V6.75H9.5A1.75 1.75 0 0 1 7.75 5V1.5h-2a.25.25 0 0 0-.25.25v3.5a.75.75 0 0 1-1.5 0v-3.5C4 .784 4.784 1 5.75 1h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 15h-3.5a.75.75 0 0 1 0-1.5h3.5a.25.25 0 0 0 .25-.25V6.75H9.5A1.75 1.75 0 0 1 7.75 5V1.5h-2a.25.25 0 0 0-.25.25v3.5a.75.75 0 0 1-1.5 0v-3.5Z" /></svg>,
    color: 'text-[#0969da]', bg: 'bg-[#ddf4ff]', label: 'Push',
  },
  issue: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" /></svg>,
    color: 'text-[#7d4e00]', bg: 'bg-[#fff8c5]', label: 'Issue',
  },
  pr: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm4.5.25a.75.75 0 0 0 0 1.5h.5v8.878a2.251 2.251 0 1 1-1.5 0V5h.5a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5h.5v8.878a2.251 2.251 0 1 1-1.5 0V5h.5a.75.75 0 0 0 0-1.5h-2Z" /><path d="M9 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 9 3.25Z" /></svg>,
    color: 'text-[#8250df]', bg: 'bg-[#fbefff]', label: 'PR',
  },
  star: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" /></svg>,
    color: 'text-[#7d4e00]', bg: 'bg-[#fff8c5]', label: 'Star',
  },
  fork: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.372a2.25 2.25 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0Z" /></svg>,
    color: 'text-[#59636e]', bg: 'bg-[#f6f8fa]', label: 'Fork',
  },
  archived: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5ZM1.75 6h12.5a.75.75 0 0 1 .75.75v6.5A1.75 1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25v-6.5A.75.75 0 0 1 1.75 6Zm4.5 3.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" /></svg>,
    color: 'text-[#bc4c00]', bg: 'bg-[#fff1e5]', label: 'Archived',
  },
}

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

// Get date group label
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

// Extract owner from "owner/repo" format
function getOwner(repoName: string): string {
  return repoName.split('/')[0] || repoName
}

// Parse event title into action + repo name
function parseEventTitle(event: RepoEvent): { repoName: string; action: string } {
  const repoName = event.repo_name
  const title = event.title
  // Titles are like "owner/repo 有新的代码推送" or "owner/repo 发布了 v1.0.0"
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

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filter === 'unread') return events.filter(e => !e.read)
    return events
  }, [events, filter])

  // Group by date
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
          <svg className="w-7 h-7 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </div>
        <p className="text-sm font-medium text-[#24292f]">暂无动态</p>
        <p className="text-xs text-[#818b98] mt-1 text-center">同步后将自动追踪仓库更新和新版本发布</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f6f8fa] overflow-hidden">
      {/* Header - GitHub feed style */}
      <div className="sticky top-0 bg-white px-4 py-2.5 border-b border-[#d0d7de] flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* Filter tabs */}
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
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            全部已读
          </button>
        )}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto">
        {groupedEvents.map((group) => (
          <div key={group.label}>
            {/* Date group header */}
            <div className="sticky top-0 bg-[#f6f8fa] px-4 py-1.5 text-[11px] font-semibold text-[#59636e] border-b border-[#d0d7de]/40 z-[5]">
              {group.label}
            </div>
            {group.items.map((event) => {
              const config = eventConfig[event.event_type] || eventConfig.push
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
                    {/* Owner avatar */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      <img
                        src={`https://github.com/${owner}.png?size=40`}
                        alt={owner}
                        className="w-8 h-8 rounded-full border border-[#d0d7de]/50"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                      />
                      {/* Event type badge */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${config.bg} ${config.color} border border-white`}>
                        {config.icon}
                      </div>
                    </div>

                    {/* Content */}
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
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {timeAgo(event.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!event.read && (
                      <span className="w-2 h-2 bg-[#0969da] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}

        {/* Footer count */}
        <div className="px-4 py-2 text-center text-[10px] text-[#818b98] border-t border-[#d0d7de]/30">
          共 {filteredEvents.length} 条动态
        </div>
      </div>
    </div>
  )
}
