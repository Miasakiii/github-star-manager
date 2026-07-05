import { useState } from 'react'
import { useStore } from '../lib/store'

// GitHub Token 格式验证（支持经典 token 和细粒度 token）
const GITHUB_TOKEN_PATTERN = /^(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{36,255}$/

function validateGitHubToken(token: string): boolean {
  return GITHUB_TOKEN_PATTERN.test(token)
}

export function LoginScreen() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const login = useStore(s => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedToken = token.trim()
    if (!trimmedToken) return

    // 验证 Token 格式
    if (!validateGitHubToken(trimmedToken)) {
      setError('Token 格式无效。GitHub Token 应以 ghp_, gho_, ghu_, ghs_ 或 ghr_ 开头')
      return
    }

    setLoading(true)
    setError('')
    try {
      await login(trimmedToken)
    } catch (err) {
      setError((err as Error).message || '登录失败，请检查 Token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[440px] h-[600px] flex flex-col bg-white overflow-hidden">
      {/* Header - GitHub dark style */}
      <div className="bg-[#24292f] px-6 pt-10 pb-8 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">GitHub Star Manager</h1>
            <p className="text-xs text-[#8b949e] mt-0.5">轻量化星标仓库管理 · 分类 · 追踪</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-6 py-5 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
          <div>
            <label className="block text-sm font-semibold text-[#24292f] mb-1.5">
              Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full pl-3 pr-10 py-2 border border-[#d0d7de] rounded-md text-sm bg-[#f6f8fa] focus:bg-white focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da]/30 transition-all placeholder:text-[#818b98]"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#818b98] hover:text-[#59636e] p-0.5"
              >
                {showToken ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-[#cf222e] bg-[#ffebe9] border border-[#ffcecb] px-3 py-2 rounded-md animate-fade-in">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full py-2 bg-[#1f883d] text-white rounded-md text-sm font-semibold hover:bg-[#1a7f37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                验证中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                登录
              </>
            )}
          </button>
        </form>

        {/* Guide */}
        <div className="mt-4 p-3.5 bg-[#f6f8fa] rounded-md border border-[#d0d7de]">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-[#0969da]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs font-semibold text-[#24292f]">如何获取 Token</span>
          </div>
          <ol className="text-xs text-[#59636e] space-y-1.5 list-none">
            {[
              '打开 GitHub → Settings → Developer settings',
              'Personal access tokens → Fine-grained tokens',
              '生成新 Token，勾选 repo 权限',
              '复制 Token 粘贴到上方输入框',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 bg-[#0969da] text-white rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
