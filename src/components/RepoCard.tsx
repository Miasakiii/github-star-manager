import type { Repo } from '../lib/db'
import { useStore } from '../lib/store'

const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Lua: '#000080',
  Zig: '#ec915c',
  Svelte: '#ff3e00',
  Jupyter: '#DA5B0B',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

function formatStars(count: number): string {
  if (count >= 10000) return `${(count / 1000).toFixed(0)}k`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

export function RepoCard({ repo }: { repo: Repo }) {
  const selectRepo = useStore(s => s.selectRepo)

  return (
    <button
      onClick={() => selectRepo(repo)}
      className="w-full text-left px-4 py-2.5 hover:bg-[#f6f8fa] transition-colors group relative border-b border-[#d0d7de]/40"
    >
      <div className="flex items-start gap-2.5">
        {/* Owner Avatar */}
        <img
          src={repo.owner_avatar || `https://github.com/${repo.owner}.png?size=80`}
          alt={repo.owner}
          className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://github.com/${repo.owner}.png?size=80` }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[#0969da] truncate group-hover:underline">
              {repo.full_name}
            </span>
            {repo.has_updates && (
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2da44e] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2da44e]" />
              </span>
            )}
            {repo.archived && (
              <span className="px-1.5 py-0.5 bg-[#fff8c5] text-[#7d4e00] text-[9px] font-medium rounded-full border border-[#eac54a]/40 flex-shrink-0">
                Archived
              </span>
            )}
            {repo.last_release_tag && (
              <span className="px-1.5 py-0.5 bg-[#dafbe1] text-[#1a7f37] text-[9px] font-medium rounded-full border border-[#4ac26b]/30 flex-shrink-0">
                {repo.last_release_tag}
              </span>
            )}
          </div>

          {repo.description && (
            <p className="text-[11px] text-[#59636e] mt-0.5 line-clamp-2 leading-relaxed">
              {repo.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {repo.language && (
              <span className="flex items-center gap-1 text-[10px] text-[#59636e]">
                <span
                  className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: languageColors[repo.language] || '#999' }}
                />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
              <svg className="w-3 h-3 text-[#818b98]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              {formatStars(repo.stargazers_count)}
            </span>
            {repo.forks_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
                <svg className="w-3 h-3 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a1.99 1.99 0 010 2.828l-7 7a1.99 1.99 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>
                {formatStars(repo.forks_count)}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
              <svg className="w-3 h-3 text-[#818b98]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {timeAgo(repo.pushed_at)}
            </span>
          </div>

          {repo.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {repo.tags.map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-[#ddf4ff] text-[#0969da] text-[9px] font-medium rounded-full border border-[#0969da]/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Arrow */}
        <svg className="w-4 h-4 text-[#818b98] group-hover:text-[#0969da] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </button>
  )
}
