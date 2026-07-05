// GitHub 认证模块
import { github, type GitHubUser } from './github'

const TOKEN_KEY = 'gh_token'
const USER_KEY = 'gh_user'

// 从 storage 获取 token
export async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([TOKEN_KEY], (result: Record<string, any>) => {
      resolve(result[TOKEN_KEY] || null)
    })
  })
}

// 保存 token
export async function storeToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [TOKEN_KEY]: token }, resolve)
  })
}

// 清除 token
export async function clearToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([TOKEN_KEY, USER_KEY], resolve)
  })
}

// 缓存用户信息
export async function getCachedUser(): Promise<GitHubUser | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([USER_KEY], (result: Record<string, any>) => {
      resolve(result[USER_KEY] || null)
    })
  })
}

export async function cacheUser(user: GitHubUser): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [USER_KEY]: user }, resolve)
  })
}

// 使用 Personal Access Token 登录
export async function loginWithToken(token: string): Promise<GitHubUser> {
  github.setToken(token)
  const user = await github.getUser()
  await storeToken(token)
  await cacheUser(user)
  return user
}

// 初始化认证（从 storage 恢复）
export async function initAuth(): Promise<GitHubUser | null> {
  const token = await getStoredToken()
  if (!token) return null

  github.setToken(token)
  try {
    const user = await github.getUser()
    await cacheUser(user)
    return user
  } catch {
    await clearToken()
    return null
  }
}

// 登出
export async function logout(): Promise<void> {
  github.setToken('')
  await clearToken()
}

// 检查是否已登录
export async function isLoggedIn(): Promise<boolean> {
  const token = await getStoredToken()
  return !!token
}
