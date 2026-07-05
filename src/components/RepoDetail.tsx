import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import type { Repo } from '../lib/db'
import { github } from '../lib/github'

const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  return `${months} 个月前`
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

// 检测文本是否包含中文
function isChineseText(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  return text.length > 0 && chineseChars / text.length > 0.05
}

// SVG 图标
const Icons = {
  clipboard: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  commit: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a1.99 1.99 0 010 2.828l-7 7a1.99 1.99 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>,
  inbox: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5l-2 3h-2l-2-3H4" /></svg>,
  starOutline: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  book: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
}

export function RepoDetail() {
  const { selectedRepo, selectRepo, updateTags, updateNotes, markRepoSeen, removeRepo } = useStore()
  const repo = selectedRepo!

  const [tags, setTags] = useState(repo.tags.join(', '))
  const [notes, setNotes] = useState(repo.notes)
  const [recentCommits, setRecentCommits] = useState<any[]>([])
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'commits'>('info')
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null)
  const [descTranslating, setDescTranslating] = useState(false)

  useEffect(() => {
    if (repo.has_updates) markRepoSeen(repo.id)
    loadCommits()
    setTranslatedDesc(null)
    // 自动翻译描述
    if (repo.description && !isChineseText(repo.description)) {
      translateDescription(repo.description)
    }
  }, [repo.id])

  const loadCommits = async () => {
    setLoadingCommits(true)
    try {
      const commits = await github.getRecentCommits(repo.owner, repo.name, 5)
      setRecentCommits(commits)
    } catch {} finally {
      setLoadingCommits(false)
    }
  }

  const translateDescription = async (text: string) => {
    setDescTranslating(true)
    try {
      const translated = await github.translateText(text, 'en', 'zh-CN')
      // 确保翻译结果确实包含中文，避免翻译失败时显示英文
      if (translated && isChineseText(translated)) {
        setTranslatedDesc(translated)
      }
    } catch {
      // 翻译失败则不显示
    } finally {
      setDescTranslating(false)
    }
  }

  const handleSaveTags = () => {
    updateTags(repo.id, tags.split(',').map(t => t.trim()).filter(Boolean))
  }

  const handleUnstar = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await removeRepo(repo.id)
  }

  const tabs = [
    { key: 'info' as const, label: '详情', icon: Icons.clipboard },
    { key: 'commits' as const, label: '提交', icon: Icons.commit },
  ]

  // 显示的描述：优先中文翻译，翻译失败回退到原文
  const displayDesc = repo.description
    ? (isChineseText(repo.description) ? repo.description : (translatedDesc || repo.description))
    : null
  // 标题：内容为中文时显示“中文简介”，否则显示“简介”
  const descIsChinese = displayDesc ? isChineseText(displayDesc) : false

  return (
    <div className="w-[440px] h-[600px] flex flex-col bg-white animate-fade-in">
      {/* Header - GitHub dark header */}
      <div className="bg-[#24292f] px-4 py-3 text-white flex-shrink-0">
        <button
          onClick={() => selectRepo(null)}
          className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white mb-2.5 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          返回列表
        </button>

        <div className="flex items-center gap-2.5">
          {/* Owner Avatar */}
          <img
            src={repo.owner_avatar || `https://github.com/${repo.owner}.png?size=80`}
            alt={repo.owner}
            className="w-8 h-8 rounded-md flex-shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://github.com/${repo.owner}.png?size=80` }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{repo.full_name}</h2>
            {repo.description && (
              <p className="text-[11px] text-[#8b949e] mt-0.5 line-clamp-1 leading-relaxed">{repo.description}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
            <svg className="w-3 h-3 text-[#8b949e]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <span className="font-medium text-white tabular-nums">{formatNum(repo.stargazers_count)}</span>
            stars
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a1.99 1.99 0 010 2.828l-7 7a1.99 1.99 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>
            <span className="font-medium text-white tabular-nums">{formatNum(repo.forks_count)}</span>
            forks
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <span className="font-medium text-white tabular-nums">{repo.open_issues_count}</span>
            issues
          </span>
          {repo.language && (
            <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: languageColors[repo.language] || '#999' }} />
              {repo.language}
            </span>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#d0d7de] flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-medium transition-all relative flex items-center justify-center gap-1.5 ${
              activeTab === tab.key ? 'text-[#24292f] border-b-2 border-[#fd8c73]' : 'text-[#59636e] hover:text-[#24292f] border-b-2 border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' ? (
          <div className="px-4 py-3 space-y-3.5 animate-fade-in">
            {/* 简介 */}
            {displayDesc && (
              <div className="p-3 bg-[#f6f8fa] rounded-md border border-[#d0d7de]/60">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-3.5 h-3.5 text-[#59636e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[11px] font-semibold text-[#24292f]">{descIsChinese ? '中文简介' : '简介'}</span>
                  {descTranslating && (
                    <svg className="w-3 h-3 text-[#0969da] animate-spin ml-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  )}
                </div>
                {descTranslating && !descIsChinese ? (
                  <p className="text-xs text-[#818b98]">正在翻译...</p>
                ) : (
                  <p className="text-xs text-[#24292f] leading-relaxed">{displayDesc}</p>
                )}
                {translatedDesc && repo.description && !isChineseText(repo.description) && (
                  <p className="text-[10px] text-[#818b98] mt-1.5 pt-1.5 border-t border-[#d0d7de]/40">{repo.description}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener"
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#1f883d] text-white rounded-md text-xs font-semibold hover:bg-[#1a7f37] transition-colors active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
                访问仓库
              </a>
              <div className="flex gap-2">
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#f6f8fa] text-[#24292f] rounded-md text-xs font-medium hover:bg-[#f3f4f6] transition-colors border border-[#d0d7de]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    主页
                  </a>
                )}
                <a
                  href={`https://github.com/${repo.owner}/${repo.name}#readme`}
                  target="_blank"
                  rel="noopener"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#f6f8fa] text-[#24292f] rounded-md text-xs font-medium hover:bg-[#f3f4f6] transition-colors border border-[#d0d7de]"
                >
                  {Icons.book}
                  README
                </a>
              </div>
            </div>

            {/* Topics */}
            {repo.topics.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold text-[#59636e] mb-1.5">Topics</h3>
                <div className="flex flex-wrap gap-1">
                  {repo.topics.map(topic => (
                    <a
                      key={topic}
                      href={`https://github.com/topics/${topic}`}
                      target="_blank"
                      rel="noopener"
                      className="px-2 py-0.5 bg-[#ddf4ff] text-[#0969da] text-[10px] font-medium rounded-full hover:bg-[#0969da] hover:text-white transition-colors"
                    >
                      {topic}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h3 className="text-[11px] font-semibold text-[#59636e] mb-1.5">自定义标签</h3>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                onBlur={handleSaveTags}
                placeholder="用逗号分隔，如：学习, 工具, 参考"
                className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded-md text-xs bg-[#f6f8fa] focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all placeholder:text-[#818b98]"
              />
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-[11px] font-semibold text-[#59636e] mb-1.5">备注</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => updateNotes(repo.id, notes)}
                placeholder="添加个人备注..."
                rows={3}
                className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded-md text-xs bg-[#f6f8fa] focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all placeholder:text-[#818b98] resize-none"
              />
            </div>

            {/* Release */}
            {repo.last_release_tag && (
              <div className="p-2.5 bg-[#dafbe1] rounded-md border border-[#4ac26b]/30">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#1a7f37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a1.99 1.99 0 010 2.828l-7 7a1.99 1.99 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" /></svg>
                  <div>
                    <p className="text-xs font-semibold text-[#1a7f37]">{repo.last_release_tag}</p>
                    {repo.last_release_at && (
                      <p className="text-[10px] text-[#1a7f37]/70">{timeAgo(repo.last_release_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="text-[10px] text-[#59636e] space-y-1 pt-2 border-t border-[#d0d7de]/40">
              <div className="flex justify-between">
                <span>创建时间</span>
                <span>{new Date(repo.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className="flex justify-between">
                <span>最后推送</span>
                <span>{timeAgo(repo.pushed_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>最后同步</span>
                <span>{timeAgo(repo.last_synced)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 animate-fade-in">
            {loadingCommits ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton h-10 rounded-md" />
                ))}
              </div>
            ) : recentCommits.length > 0 ? (
              <div className="space-y-1.5">
                {recentCommits.map((commit: any, i: number) => (
                  <a
                    key={i}
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener"
                    className="block px-2.5 py-2 bg-[#f6f8fa] hover:bg-[#f3f4f6] rounded-md transition-colors group border border-[#d0d7de]/40"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[10px] text-[#59636e] bg-[#eff1f3] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 border border-[#d0d7de]/40">
                        {commit.sha?.slice(0, 7)}
                      </span>
                      <p className="text-xs text-[#24292f] line-clamp-2 group-hover:text-[#0969da] transition-colors">
                        {commit.commit?.message?.split('\n')[0]}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[#818b98]">
                {Icons.inbox}
                <p className="text-xs mt-2">暂无提交记录</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#d0d7de] flex-shrink-0">
        <button
          onClick={handleUnstar}
          className={`w-full py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            confirmDelete
              ? 'bg-[#cf222e] text-white hover:bg-[#a40e26]'
              : 'bg-[#f6f8fa] text-[#cf222e] hover:bg-[#f3f4f6] border border-[#d0d7de]'
          }`}
        >
          {confirmDelete ? (
            <>确认取消星标？</>
          ) : (
            <>
              {Icons.starOutline}
              取消星标
            </>
          )}
        </button>
      </div>
    </div>
  )
}
