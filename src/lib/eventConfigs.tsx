import React from 'react'

export interface EventTypeConfig {
  icon: React.ReactElement
  color: string
  bg: string
  label: string
}

export const EVENT_CONFIGS: Record<string, EventTypeConfig> = {
  release: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 7.775V2.75a.25.25 0 0 1 .25-.25h5.025a3.5 3.5 0 0 0 2.317-.876L11.5.5 9.408 1.624A3.5 3.5 0 0 0 7.091.75H2.75A1.75 1.75 0 0 0 1 2.5v5.275c0 .273.06.54.174.786L3.5 13.5l2.326-4.94a3.5 3.5 0 0 0 .174-.785Zm11.5 4.25V4.225a3.5 3.5 0 0 0-2.317.876L9.5 6.5l2.092-1.124A3.5 3.5 0 0 0 13.908 4.5H15a.25.25 0 0 1 .25.25v6.775a3.5 3.5 0 0 0-1-.876L12.5 13.5l-1.75-1.85a3.5 3.5 0 0 0-2.317-.876H6.5l3.317 1.124A3.5 3.5 0 0 0 12.5 13.5l2.326-1.5a3.5 3.5 0 0 1-1 .876Z" /></svg>,
    color: 'text-[#1a7f37]', bg: 'bg-[#dafbe1]', label: 'Release',
  },
  push: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.75C4 .784 4.784 0 5.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 15h-3.5a.75.75 0 0 1 0-1.5h3.5a.25.25 0 0 0 .25-.25V6.75H9.5A1.75 1.75 0 0 1 7.75 5V1.5h-2a.25.25 0 0 0-.25.25v3.5a.75.75 0 0 1-1.5 0v-3.5C4 .784 4.784 1 5.75 1h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 14.25 15h-3.5a.75.75 0 0 1 0-1.5h3.5a.25.25 0 0 0 .25-.25V6.75H9.5A1.75 1.75 0 0 1 7.75 5V1.5h-2a.25.25 0 0 0-.25.25v3.5a.75.75 0 0 1-1.5 0v-3.5Z" /></svg>,
    color: 'text-[#0969da]', bg: 'bg-[#ddf4ff]', label: 'Push',
  },
  issue: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" /></svg>,
    color: 'text-[#7d4e00]', bg: 'bg-[#fff8c5]', label: 'Issue',
  },
  pr: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm4.5.25a.75.75 0 0 0 0 1.5h.5v8.878a2.251 2.251 0 1 1-1.5 0V5h.5a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5h.5v8.878a2.251 2.251 0 1 1-1.5 0V5h.5a.75.75 0 0 0 0-1.5h-2Z" /><path d="M9 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 9 3.25Z" /></svg>,
    color: 'text-[#8250df]', bg: 'bg-[#fbefff]', label: 'PR',
  },
  star: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" /></svg>,
    color: 'text-[#7d4e00]', bg: 'bg-[#fff8c5]', label: 'Star',
  },
  fork: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.372a2.25 2.25 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0Z" /></svg>,
    color: 'text-[#59636e]', bg: 'bg-[#f6f8fa]', label: 'Fork',
  },
  archived: {
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5ZM1.75 6h12.5a.75.75 0 0 1 .75.75v6.5A1.75 1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25v-6.5A.75.75 0 0 1 1.75 6Zm4.5 3.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" /></svg>,
    color: 'text-[#bc4c00]', bg: 'bg-[#fff1e5]', label: 'Archived',
  },
}
