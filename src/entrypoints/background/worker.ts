// Background Service Worker
// 负责定时同步、检查更新、推送通知

chrome.runtime.onInstalled.addListener(() => {
  // 设置定时同步闹钟（每30分钟）
  chrome.alarms.create('sync-repos', { periodInMinutes: 30 })
  // 检查 release（每2小时）
  chrome.alarms.create('check-releases', { periodInMinutes: 120 })
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-repos') {
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }).catch(() => {})
  }
  if (alarm.name === 'check-releases') {
    chrome.runtime.sendMessage({ type: 'CHECK_RELEASES' }).catch(() => {})
  }
})

// 监听来自 popup/sidepanel 的消息（仅接受扩展内部消息）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 验证消息来源：只接受本扩展自身发送的消息
  if (sender.id !== chrome.runtime.id) {
    return false
  }

  if (message.type === 'OPEN_SIDEPANEL') {
    chrome.sidePanel.open({ tabId: message.tabId }).catch(() => {})
    sendResponse({ ok: true })
  }

  // 处理通知请求
  if (message.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create(message.id || 'star-manager', {
      type: 'basic',
      iconUrl: 'public/icon128.png',
      title: message.title || 'GitHub Star Manager',
      message: message.message || '',
      priority: 1,
    })
    sendResponse({ ok: true })
  }

  // 批量通知（新 releases）
  if (message.type === 'SHOW_RELEASE_NOTIFICATIONS') {
    const releases = message.releases || []
    releases.forEach((release: any, i: number) => {
      setTimeout(() => {
        chrome.notifications.create(`release-${release.repo_id}-${release.tag}`, {
          type: 'basic',
          iconUrl: 'public/icon128.png',
          title: `新版本发布`,
          message: `${release.repo_name} 发布了 ${release.tag}`,
          priority: 2,
        })
      }, i * 1500) // 间隔 1.5s 避免通知轰炸
    })
    sendResponse({ ok: true })
  }

  return true
})

// 点击通知打开对应页面
chrome.notifications.onClicked.addListener((notificationId) => {
  // 打开 popup
  chrome.action.openPopup().catch(() => {})
})

// 快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-popup') {
    chrome.action.openPopup().catch(() => {})
  }
  if (command === 'open-sidepanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id }).catch(() => {})
      }
    })
  }
  if (command === 'trigger-sync') {
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }).catch(() => {})
  }
})

export {}
