import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useStore, type FilterType } from '../lib/store'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/classify'
import { Icons } from '../lib/icons'
import { LANGUAGE_COLORS } from '../lib/utils'
import type { ReactNode } from 'react'

function FilterDropdown({
  label,
  icon,
  items,
  activeValue,
  onSelect,
}: {
  label: string
  icon: ReactNode
  items: { id: string; label: string; count?: number; colorDot?: string }[]
  activeValue: string | null
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 4, left: rect.left })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-dropdown-portal]') || target.closest('[data-dropdown-btn]')) return
      setOpen(false)
    }

    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()

    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, updatePosition])

  if (items.length === 0) return null

  const btnClass = `flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
    activeValue
      ? 'bg-[#ddf4ff] text-[#0969da] border border-[#0969da]/20'
      : 'bg-[#f6f8fa] text-[#59636e] hover:bg-[#f3f4f6] border border-[#d0d7de]'
  }`

  const menu = open ? createPortal(
    <div
      data-dropdown-portal
      className="bg-white rounded-md shadow-lg border border-[#d0d7de] py-1 w-40 max-h-48 overflow-y-auto z-[9999] animate-fade-in-scale"
      style={{ position: 'fixed', top: position.top, left: position.left }}
    >
      {items.map(item => (
        <button
          key={item.id}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(item.id)
            setOpen(false)
          }}
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#f6f8fa] flex items-center justify-between transition-colors ${
            activeValue === item.id ? 'text-[#0969da] bg-[#ddf4ff]' : 'text-[#24292f]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {item.colorDot && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.colorDot }} />
            )}
            {item.label}
          </span>
          {item.count !== undefined && (
            <span className="text-[10px] text-[#818b98] tabular-nums">{item.count}</span>
          )}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        data-dropdown-btn
        onClick={() => setOpen(!open)}
        className={btnClass}
      >
        {icon}
        {activeValue || label}
        {Icons.chevron}
      </button>
      {menu}
    </>
  )
}

export function FilterBar() {
  const { filterType, filterValue, setFilter, repos, categoryStats } = useStore()

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

  const filters: { type: Exclude<FilterType, 'language' | 'tag' | 'category'>; label: string; icon: ReactNode }[] = [
    { type: 'all', label: '全部', icon: Icons.list },
    { type: 'updates', label: '有更新', icon: Icons.bell },
    { type: 'archived', label: '归档', icon: Icons.archive },
  ]

  const btnClass = (active: boolean) =>
    `flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-[#ddf4ff] text-[#0969da] border border-[#0969da]/20'
        : 'bg-[#f6f8fa] text-[#59636e] hover:bg-[#f3f4f6] border border-[#d0d7de]'
    }`

  const languageItems = languages.map(([lang, count]) => ({
    id: lang,
    label: lang,
    count,
    colorDot: LANGUAGE_COLORS[lang] || '#999',
  }))

  const tagItems = tags.map(([tag, count]) => ({
    id: tag,
    label: tag,
    count,
  }))

  const categoryItems = CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label,
    count: categoryStats[cat.id] || 0,
  }))

  return (
    <div className="flex items-center gap-1.5 mt-2 whitespace-nowrap">
      {filters.map(f => (
        <button
          key={f.type}
          onClick={() => setFilter(f.type)}
          className={btnClass(filterType === f.type)}
        >
          {f.icon}
          {f.label}
        </button>
      ))}

      <FilterDropdown
        label="语言"
        icon={Icons.globe}
        items={languageItems}
        activeValue={filterType === 'language' ? filterValue : null}
        onSelect={(lang) => setFilter('language', lang)}
      />

      <FilterDropdown
        label="标签"
        icon={Icons.tag}
        items={tagItems}
        activeValue={filterType === 'tag' ? filterValue : null}
        onSelect={(tag) => setFilter('tag', tag)}
      />

      <FilterDropdown
        label="分类"
        icon={Icons.tag}
        items={categoryItems}
        activeValue={filterType === 'category' ? filterValue : null}
        onSelect={(cat) => setFilter('category', cat)}
      />
    </div>
  )
}
