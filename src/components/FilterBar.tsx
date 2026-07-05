import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore, type FilterType } from '../lib/store'

// SVG 图标
const Icons = {
  list: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  bell: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  archive: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  globe: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  tag: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a1.99 1.99 0 010 2.828l-7 7a1.99 1.99 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>,
  chevron: <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
}

export function FilterBar() {
  const { filterType, filterValue, setFilter, repos } = useStore()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  const languages = useMemo(() => {
    const langMap = new Map<string, number>()
    repos.forEach(r => { if (r.language) langMap.set(r.language, (langMap.get(r.language) || 0) + 1) })
    return Array.from(langMap.entries()).sort((a, b) => b[1] - a[1])
  }, [repos])

  const tags = useMemo(() => {
    const tagMap = new Map<string, number>()
    repos.forEach(r => r.tags.forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1)))
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1])
  }, [repos])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false)
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) setShowTagMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filters: { type: FilterType; label: string; icon: JSX.Element }[] = [
    { type: 'all', label: '全部', icon: Icons.list },
    { type: 'updates', label: '有更新', icon: Icons.bell },
    { type: 'archived', label: '归档', icon: Icons.archive },
  ]

  const isActive = (type: FilterType, value?: string) => {
    if (value) return filterType === type && filterValue === value
    return filterType === type && !filterValue
  }

  const btnClass = (active: boolean) =>
    `flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-[#ddf4ff] text-[#0969da] border border-[#0969da]/20'
        : 'bg-[#f6f8fa] text-[#59636e] hover:bg-[#f3f4f6] border border-[#d0d7de]'
    }`

  return (
    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none">
      {filters.map(f => (
        <button
          key={f.type}
          onClick={() => setFilter(f.type)}
          className={btnClass(isActive(f.type))}
        >
          {f.icon}
          {f.label}
        </button>
      ))}

      {/* Language dropdown */}
      {languages.length > 0 && (
        <div className="relative" ref={langRef}>
          <button
            onClick={() => { setShowLangMenu(!showLangMenu); setShowTagMenu(false) }}
            className={btnClass(filterType === 'language')}
          >
            {Icons.globe}
            {filterType === 'language' && filterValue ? filterValue : '语言'}
            {Icons.chevron}
          </button>
          {showLangMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white rounded-md shadow-lg border border-[#d0d7de] py-1 w-40 max-h-48 overflow-y-auto z-50 animate-fade-in-scale">
              {languages.map(([lang, count]) => (
                <button
                  key={lang}
                  onClick={() => { setFilter('language', lang); setShowLangMenu(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#f6f8fa] flex items-center justify-between transition-colors ${
                    isActive('language', lang) ? 'text-[#0969da] bg-[#ddf4ff]' : 'text-[#24292f]'
                  }`}
                >
                  <span>{lang}</span>
                  <span className="text-[10px] text-[#818b98] tabular-nums">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tag dropdown */}
      {tags.length > 0 && (
        <div className="relative" ref={tagRef}>
          <button
            onClick={() => { setShowTagMenu(!showTagMenu); setShowLangMenu(false) }}
            className={btnClass(filterType === 'tag')}
          >
            {Icons.tag}
            {filterType === 'tag' && filterValue ? filterValue : '标签'}
            {Icons.chevron}
          </button>
          {showTagMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white rounded-md shadow-lg border border-[#d0d7de] py-1 w-40 max-h-48 overflow-y-auto z-50 animate-fade-in-scale">
              {tags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => { setFilter('tag', tag); setShowTagMenu(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#f6f8fa] flex items-center justify-between transition-colors ${
                    isActive('tag', tag) ? 'text-[#0969da] bg-[#ddf4ff]' : 'text-[#24292f]'
                  }`}
                >
                  <span>{tag}</span>
                  <span className="text-[10px] text-[#818b98] tabular-nums">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
