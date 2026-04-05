# 脉刻 maik — 技术架构文档

> 本文档为 `README.md` 的技术部分，所有AI必须严格遵守。

---

## 一、架构概览

```
┌──────────────────────────────────────────────────────────────┐
│                        用户侧                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ RN App   │  │ 招聘者Web│  │ 营销官网  │  │浏览器插件│  │
│  │(求职者端) │  │(Next.js) │  │(Next.js) │  │(猎头端)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
└────────┼────────────┼────────────┼─────────────┼──────────┘
         │            │            │             │
         └────────────┴────────────┴─────────────┘
                              │
                     ┌────────┴────────┐
                     │  Fastify API     │
                     │  (统一后端)      │
                     └────────┬────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                     │
   PostgreSQL            Meilisearch             Redis
  (腾讯云)              (自建，2核4G)      (腾讯云轻量版)
         │                    │                     │
         └────────────────────┴────────────────────┘
                              │
                     腾讯云 COS（文件存储）
```

## 二、技术栈明细

| 层级 | 选型 | 版本要求 | 说明 |
|------|------|---------|------|
| 求职者App | React Native + Expo | latest | TypeScript，一套代码三端 |
| 招聘者Web | Next.js App Router | ^14 | TypeScript，响应式 |
| 营销官网 | Next.js + output:'export' | ^14 | 静态导出，Vercel部署 |
| 后端API | Fastify | ^4 | TypeScript + Zod |
| 浏览器插件 | Chrome Extension MV3 | — | TypeScript，猎头端数据采集 |
| 数据库 | PostgreSQL | 15+ | 腾讯云 |
| 搜索 | Meilisearch | ^1.6 | 自建，中文jieba |
| 缓存 | Redis | 7+ | 腾讯云轻量版 |
| 文件存储 | 腾讯云COS | — | 简历附件/头像 |
| 移动端发布 | Expo EAS | — | iOS TestFlight + Android |
| 静态部署 | Vercel | — | 营销站+招聘者Web |
| API部署 | 腾讯云服务器 | 2核4G起步 | pm2管理 |

## 三、目录结构

```
maik/
├── apps/
│   ├── marketing/           # 营销官网 (Next.js 静态)
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── about/
│   │   │   └── register/
│   │   └── next.config.js
│   │
│   ├── web/                # 招聘者Web后台 (Next.js SSR)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── resumes/
│   │   │   │   ├── jobs/
│   │   │   │   ├── orders/
│   │   │   │   └── analytics/
│   │   │   └── api/
│   │   └── components/
│   │
│   ├── mobile/             # 求职者App (React Native Expo)
│   │   ├── app/
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx   # 广场
│   │   │   │   ├── search.tsx
│   │   │   │   ├── messages.tsx
│   │   │   │   └── profile.tsx
│   │   │   └── job/[id].tsx
│   │   └── components/
│   │
│   └── extension/          # Chrome浏览器插件 (Manifest V3)
│       ├── manifest.json
│       ├── src/
│       │   ├── content.ts    # 内容脚本：注入页面采集简历数据
│       │   ├── popup.ts      # 弹窗UI
│       │   ├── background.ts  # 后台服务：队列+API同步
│       │   ├── service-worker.ts
│       │   └── utils/
│       │       ├── parser.ts  # DOM解析（各平台结构不同）
│       │       └── api.ts    # 与Fastify API通信
│       └── icons/
│
├── packages/
│   └── api/                # Fastify API（共用）
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── resumes.ts
│       │   │   ├── jobs.ts
│       │   │   ├── referrals.ts
│       │   │   ├── messages.ts
│       │   │   ├── users.ts
│       │   │   └── extension.ts  # 插件数据同步接口
│       │   ├── plugins/
│       │   └── schemas/
│       └── package.json
│
├── infra/
│   ├── meilisearch/
│   │   └── indexer.ts
│   ├── db/
│   │   └── migrations/
│   └── cos/
│       └── upload.ts
│
└── docs/
```

## 四、浏览器插件设计（猎头端）

### 核心功能

| 功能 | 说明 |
|------|------|
| 简历自动采集 | 访问猎聘/脉脉/BOSS等页面时，一键采集简历数据 |
| 简历库同步 | 采集的简历自动同步到脉刻伯乐简历库 |
| 快速推荐 | 选中简历后一键推荐给平台内的招聘需求 |
| 平台切换 | 同时管理多个招聘平台的简历，不用来回切换 |

### 支持的平台

| 平台 | 解析难度 | 优先级 |
|------|---------|--------|
| 猎聘 | 中（结构化较好） | P0 |
| BOSS直聘 | 中（反爬较强） | P0 |
| 脉脉 | 高（动态渲染） | P1 |
| 前程无忧 | 低（结构固定） | P1 |
| 领英 | 高（需OAuth） | P2 |

### 数据流

```
插件采集简历（content script）
    ↓
background service worker 接收数据
    ↓
本地消息队列（IndexedDB，待上传数据）
    ↓
定期同步 / 用户点击同步按钮
    ↓
POST /api/extension/sync → Fastify API
    ↓
简历解析（规则+AI）
    ↓
PostgreSQL + Meilisearch 更新简历库
    ↓
通知用户："简历已更新"（App推送/微信）
```

### Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "脉刻伯乐助手",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "https://www.liepin.com/*",
    "https://www.zhipin.com/*",
    "https://maimai.cn/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon.png"
  },
  "content_scripts": [{
    "matches": ["*://*.liepin.com/*", "*://*.zhipin.com/*"],
    "js": ["content.bundle.js"],
    "css": ["styles/content.css"]
  }],
  "background": {
    "service_worker": "background.bundle.js"
  }
}
```

## 五、2核4G服务器资源限制

> ⚠️ 2核4G同时跑Meilisearch+Node+Redis会OOM，以下配置必须遵守：

### Meilisearch 启动参数
```bash
./meilisearch \
  --http-addr 127.0.0.1:7700 \
  --env production \
  --no-analytics \
  --db-path ./data.ms \
  --max-memory-ratio 0.5 \
  --max-indexing-threads 1 \
  --max-search-batch-size 100 \
  --http-payload-size-limit 100Mb
```

### pm2 配置 (ecosystem.config.js)
```js
module.exports = {
  apps: [{
    name: 'maik-api',
    script: 'dist/index.js',
    instances: 1,
    max_memory_restart: '512M',
    env: { NODE_ENV: 'production', PORT: 3000 },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

### 内存使用规划
| 服务 | 预估内存 | 说明 |
|------|---------|------|
| Meilisearch | ≤800MB | max-memory-ratio 0.5 限制 |
| Node.js (pm2) | ≤512MB | max_memory_restart 限制 |
| OS + Redis | ≤500MB | 腾讯云Redis轻量版走外网 |
| **总计** | **≤1.8GB** | 有充足余量 |

**推荐升级：** 4核8G，资源问题彻底消除。

## 六、中英双语支持

所有UI文本使用 i18n：
```typescript
// packages/i18n/
export const zh = {
  nav: { home: '首页', about: '关于', register: '注册' },
  hero: { title: '让每一个职场人成为人才猎手' },
}
export const en = {
  nav: { home: 'Home', about: 'About', register: 'Register' },
  hero: { title: 'Every professional is a talent scout.' },
}
```

语言切换：Cookie/LocalStorage 存储偏好，Next.js Middleware 读取并注入。
