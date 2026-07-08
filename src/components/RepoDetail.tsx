import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../lib/store'
import type { Repo } from '../lib/db'
import { github } from '../lib/github'
import { Icons } from '../lib/icons'
import {
  safeAvatarUrl, timeAgoFull, timeAgoShort, formatStars,
  LANGUAGE_COLORS, isChineseText,
} from '../lib/utils'

export function RepoDetail() {
  const { selectedRepo, selectRepo, updateTags, updateNotes, markRepoSeen, removeRepo } = useStore()
  const repo = selectedRepo!
  const repoIdRef = useRef(repo.id)

  const [tags, setTags] = useState(repo.tags.join(', '))
  const [notes, setNotes] = useState(repo.notes)
  const [recentCommits, setRecentCommits] = useState<any[]>([])
  const [loadingCommits, setLoadingCommits] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'commits'>('info')
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null)
  const [descTranslating, setDescTranslating] = useState(false)

  // 切换仓库时重置状态
  useEffect(() => {
    if (repo.id !== repoIdRef.current) {
      repoIdRef.current = repo.id
      setTags(repo.tags.join(', '))
      setNotes(repo.notes)
      setTranslatedDesc(null)
      setDescTranslating(false)
      setRecentCommits([])
      setActiveTab('info')
      setConfirmDelete(false)
    }
  }, [repo.id])

  useEffect(() => {
    if (repo.has_updates) markRepoSeen(repo.id)
    loadCommits()
    if (repo.description && !isChineseText(repo.description)) {
      translateDescription(repo.description)
    }
  }, [repo.id])

  const loadCommits = async () => {
    setLoadingCommits(true)
    try {
      const commits = await github.getRecentCommits(repo.owner, repo.name, 5)
      setRecentCommits(commits)
    } catch (error) {
      console.warn('Failed to load commits:', error)
    } finally {
      setLoadingCommits(false)
    }
  }

  const translateDescription = useCallback(async (text: string) => {
    setDescTranslating(true)
    try {
      const translated = await github.translateText(text, 'en', 'zh-CN')
      if (translated && isChineseText(translated)) {
        setTranslatedDesc(translated)
      }
    } catch (error) {
      console.warn('Translation failed:', error)
    } finally {
      setDescTranslating(false)
    }
  }, [])

  const handleSaveTags = () => {
    updateTags(repo.id, tags.split(',').map(t => t.trim()).filter(Boolean))
  }

  const handleUnstar = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await removeRepo(repo.id)
  }

  const displayDesc = repo.description
    ? (isChineseText(repo.description) ? repo.description : (translatedDesc || repo.description))
    : null
  const descIsChinese = displayDesc ? isChineseText(displayDesc) : false

  const tabs = [
    { key: 'info' as const, label: '详情', icon: Icons.gitCommit },
    { key: 'commits' as const, label: '提交', icon: Icons.book },
  ]

  return (
    <div className="w-[440px] h-[600px] flex flex-col bg-white animate-fade-in">
      {/* Header */}
      <div className="bg-[#24292f] px-4 py-3 text-white flex-shrink-0">
        <button
          onClick={() => selectRepo(null)}
          className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white mb-2.5 transition-colors group"
        >
          {Icons.back}
          返回列表
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={safeAvatarUrl(repo.owner, repo.owner_avatar)}
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

        <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
            {Icons.star}
            <span className="font-medium text-white tabular-nums">{formatStars(repo.stargazers_count)}</span>
            stars
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
            {Icons.fork}
            <span className="font-medium text-white tabular-nums">{formatStars(repo.forks_count)}</span>
            forks
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
            {Icons.info}
            <span className="font-medium text-white tabular-nums">{repo.open_issues_count}</span>
            issues
          </span>
          {repo.language && (
            <span className="flex items-center gap-1 text-[11px] text-[#8b949e]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#999' }} />
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
                  {Icons.info}
                  <span className="text-[11px] font-semibold text-[#24292f]">{descIsChinese ? '中文简介' : '简介'}</span>
                  {descTranslating && (
                    <svg className="w-3 h-3 text-[#0969da] animate-spin ml-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
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
                {Icons.star}
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
                    {Icons.globe}
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
                  {Icons.star}
                  <div>
                    <p className="text-xs font-semibold text-[#1a7f37]">{repo.last_release_tag}</p>
                    {repo.last_release_at && (
                      <p className="text-[10px] text-[#1a7f37]/70">{timeAgoFull(repo.last_release_at)}</p>
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
                <span>{timeAgoShort(repo.pushed_at)} 前</span>
              </div>
              <div className="flex justify-between">
                <span>最后同步</span>
                <span>{timeAgoShort(repo.last_synced)} 前</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 animate-fade-in">
            {loadingCommits ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
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
                {Icons.emptyInbox}
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
          {Icons.starOutline}
          {confirmDelete ? '确认取消星标？' : '取消星标'}
        </button>
      </div>
    </div>
  )
}
