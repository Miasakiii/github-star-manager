# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Chrome 浏览器扩展插件，用于管理 GitHub 星标仓库。用户通过 Personal Access Token 认证后，插件会同步所有星标仓库到本地 IndexedDB，提供分类、搜索、过滤、排序、事件追踪等功能。项目有两个前端入口：popup（440x600 固定尺寸弹窗）和 sidepanel（全宽侧边栏），共享同一个 Zustand store 和 Dexie 数据库实例。

## 命令

```bash
npm install          # 安装依赖
npm run dev          # 开发模式（Vite HMR）
npm run build        # 生产构建：build:ui + build:bg + copy-files
npm run build:ui     # Vite 构建 UI
npm run build:bg     # esbuild 构建 background service worker
npm run preview      # 预览构建产物
```

构建产物输出到 `dist/`，包含 `manifest.json`、`popup.html`、`sidepanel.html`、`background/worker.js` 等 Chrome 扩展所需文件。开发时加载 `dist/` 文件夹到 Chrome 扩展管理页。

## 架构

### 三层数据流

```
GitHub REST API → src/lib/sync.ts → Dexie (IndexedDB) → Zustand store → React 组件
```

- **API 层** (`src/lib/github.ts`): `GitHubClient` 单例，封装所有 GitHub API 调用（获取星标仓库、release、commits、README 翻译等）。所有 token 通过 `setToken()` 注入。
- **数据层** (`src/lib/db.ts`): Dexie 数据库，三个表 — `repos`（仓库主数据，带 tags、notes、category 等自定义字段）、`events`（动态事件）、`syncMeta`（同步元数据）。Dexie 类型通过 `EntityTable` 泛型约束。
- **状态层** (`src/lib/store.ts`): 单个 Zustand store，包含认证、仓库数据、过滤排序、分类视图、同步状态、事件等全部状态。`applyFilterAndSort` 纯函数处理过滤/排序逻辑。

### 双入口共享同一套逻辑

- `src/entrypoints/popup/` — 440x600 固定弹窗，`Dashboard` + `RepoCard` + `RepoDetail` 三屏切换
- `src/entrypoints/sidepanel/` — 宽屏分栏布局，左侧列表 + 右侧详情，支持分类视图切换
- 两个入口都调用同一个 `useStore().init()`，共享 `src/lib/` 下的全部模块和 `src/components/` 下的组件

### Background Service Worker

`src/entrypoints/background/worker.ts` 是 Manifest V3 service worker，负责：
- 每 30 分钟自动同步星标仓库（`chrome.alarms`）
- 每 2 小时检查新 release
- 推送 Chrome 通知
- 键盘快捷键（Alt+S / Alt+Shift+S / Alt+R）
- 消息白名单验证（仅接受本扩展内部消息）

### 关键设计要点

1. **自动分类**: `src/lib/classify.ts` 基于关键词规则的仓库自动分类引擎，同步时自动注入 `category` 字段，已有仓库通过 `backfillCategories()` 补充
2. **Markdown 渲染**: `src/lib/markdown.ts` 轻量级安全渲染器，先转义 HTML 再解析 Markdown 语法，防止 XSS
3. **GitHub Token 安全**: 登录时正则验证 token 格式（`ghp_|gho_|ghu_|ghs_|ghr_|github_pat_`），GitHub API 参数通过 `validateRepoParams()` 校验（防路径遍历）
4. **样式**: Tailwind CSS 4 + 自定义 CSS 变量，颜色直接使用 GitHub 设计系统的十六进制值（`#24292f`、`#0969da` 等），无暗色模式

## 技术栈

- React 19 + TypeScript（严格模式）
- Vite 6 + esbuild（UI + background 分别构建）
- Tailwind CSS 4（`@tailwindcss/vite` 插件）
- Zustand 5（全局状态）
- Dexie 4（IndexedDB 封装）
- Chrome Extension Manifest V3

## 路径别名

`@/` → `src/`（在 `tsconfig.json` 和 `vite.config.ts` 中配置）
