# GitHub Star Manager ⭐

轻量化 GitHub 星标仓库管理器 Chrome 插件 — 分类、搜索、动态追踪、热点推送。

## 功能特性

- 🔐 **GitHub Token 登录** — 使用 Personal Access Token 快速认证
- 📋 **星标仓库列表** — 一览所有星标仓库，支持搜索、过滤、排序
- 🏷️ **自定义标签** — 为仓库添加自定义标签，方便分类管理
- 📝 **备注功能** — 为每个仓库添加个人备注
- 🔔 **动态追踪** — 自动检测仓库更新、新 Release、代码推送
- 🔍 **快速搜索** — 按名称、描述、标签、Topics 搜索
- 📊 **数据统计** — 总星标数、有更新数、语言分布、归档数
- ⏰ **定时同步** — 每30分钟自动同步仓库数据
- 🖥️ **Side Panel** — 宽屏侧边栏视图，深度浏览仓库详情

## 安装使用

### 1. 构建插件

```bash
npm install
npm run build
```

### 2. 加载到 Chrome

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist` 文件夹

### 3. 获取 GitHub Token

1. 打开 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击「Generate new token (classic)」
3. 勾选 `repo` 权限
4. 复制生成的 Token

### 4. 登录

点击浏览器工具栏的插件图标，粘贴 Token 即可登录。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（Vite HMR）
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

- **框架**: React 19 + TypeScript
- **构建**: Vite 6 + esbuild
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **本地存储**: Dexie (IndexedDB)
- **API**: GitHub REST API v3

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── LoginScreen.tsx  # 登录页面
│   ├── Dashboard.tsx    # 主仪表盘
│   ├── RepoCard.tsx     # 仓库卡片
│   ├── RepoDetail.tsx   # 仓库详情
│   ├── StatsBar.tsx     # 统计栏
│   ├── FilterBar.tsx    # 过滤栏
│   └── EventList.tsx    # 动态列表
├── lib/                 # 核心逻辑
│   ├── github.ts        # GitHub API 客户端
│   ├── auth.ts          # 认证模块
│   ├── db.ts            # 数据库 (Dexie)
│   ├── sync.ts          # 同步逻辑
│   └── store.ts         # 状态管理 (Zustand)
├── entrypoints/         # 入口点
│   ├── popup/           # 弹出窗口
│   ├── sidepanel/       # 侧边栏
│   └── background/      # 后台服务
└── index.css            # 全局样式
```

## License

MIT
