import { useStore } from '../lib/store'
import { Icons } from '../lib/icons'

export function StatsBar() {
  const stats = useStore(s => s.stats)

  const items = [
    { label: '总星标', value: stats.total, icon: Icons.star },
    { label: '有更新', value: stats.withUpdates, icon: Icons.bell },
    { label: '语言', value: stats.languages, icon: Icons.globe },
    { label: '归档', value: stats.archived, icon: Icons.archive },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <div className="w-px h-5 bg-white/10" />}
          <div className="flex items-center gap-1">
            <span className="text-[#8b949e]">{item.icon}</span>
            <span className="text-sm font-bold tabular-nums text-white">{item.value}</span>
            <span className="text-[10px] text-[#8b949e]">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
