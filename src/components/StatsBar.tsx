interface Stats {
  total: number
  archived: number
  withUpdates: number
  languages: number
  unreadEvents: number
}

export function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: '总星标', value: stats.total, icon: (
      <svg className="w-3 h-3 text-[#8b949e]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    ) },
    { label: '有更新', value: stats.withUpdates, icon: (
      <svg className="w-3 h-3 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    ) },
    { label: '语言', value: stats.languages, icon: (
      <svg className="w-3 h-3 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ) },
    { label: '归档', value: stats.archived, icon: (
      <svg className="w-3 h-3 text-[#8b949e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
    ) },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <div className="w-px h-5 bg-white/10" />}
          <div className="flex items-center gap-1">
            {item.icon}
            <span className="text-sm font-bold tabular-nums text-white">{item.value}</span>
            <span className="text-[10px] text-[#8b949e]">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
