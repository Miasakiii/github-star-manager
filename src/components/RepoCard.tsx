import type { Repo } from '../lib/db'
import { useStore } from '../lib/store'
import { Icons } from '../lib/icons'
import { safeAvatarUrl, timeAgoShort, formatStars, LANGUAGE_COLORS } from '../lib/utils'

export function RepoCard({ repo }: { repo: Repo }) {
  const selectRepo = useStore(s => s.selectRepo)

  return (
    <button
      onClick={() => selectRepo(repo)}
      className="w-full text-left px-4 py-2.5 hover:bg-[#f6f8fa] transition-colors group relative border-b border-[#d0d7de]/40"
    >
      <div className="flex items-start gap-2.5">
        <img
          src={safeAvatarUrl(repo.owner, repo.owner_avatar)}
          alt={repo.owner}
          className="w-7 h-7 rounded-md flex-shrink-0 mt-0.5"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://github.com/${repo.owner}.png?size=80` }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[#0969da] truncate group-hover:underline">
              {repo.full_name}
            </span>
            {repo.has_updates && (
              <span className="relative flex h-2 w-2 flex-shrink-0" title="有更新">
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
                <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#999' }} />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
              {Icons.star}
              {formatStars(repo.stargazers_count)}
            </span>
            {repo.forks_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
                {Icons.fork}
                {formatStars(repo.forks_count)}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-[#59636e]">
              {Icons.clock}
              {timeAgoShort(repo.pushed_at)}
            </span>
          </div>

          {repo.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {repo.tags.map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-[#ddf4ff] text-[#0969da] text-[9px] font-medium rounded-full border border-[#0969da]/15">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <svg className="w-4 h-4 text-[#818b98] group-hover:text-[#0969da] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </button>
  )
}
