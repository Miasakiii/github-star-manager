import { useEffect } from 'react'
import { useStore } from '../../lib/store'
import { LoginScreen } from '../../components/LoginScreen'
import { Dashboard } from '../../components/Dashboard'
import { RepoDetail } from '../../components/RepoDetail'

export default function App() {
  const { isAuthenticated, isLoading, selectedRepo, init } = useStore()

  useEffect(() => {
    init()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] w-[440px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0969da] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#818b98]">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  if (selectedRepo) {
    return <RepoDetail />
  }

  return <Dashboard />
}
