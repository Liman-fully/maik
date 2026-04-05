# 脉刻 (Maik) 开发手册

## 1. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 (Web) | Next.js 14 (App Router) | ^14.x |
| 前端 (App) | Next.js 14 + Capacitor / React Native | ^14.x |
| 后端 API | NestJS | ^10.x |
| 数据库 | PostgreSQL | 16.x |
| 缓存 | Redis | 7.x |
| 搜索引擎 | Meilisearch | 1.x |
| 对象存储 | 腾讯云 COS | - |
| 包管理 | pnpm | ^8.x |

---

## 2. 项目结构

```
maik/
├── apps/
│   ├── web/                 # 招聘者 Web 端 (Next.js)
│   ├── app/                 # 求职者/伯乐 App 端 (Next.js + Capacitor)
│   └── api/                 # NestJS API 服务
├── packages/
│   ├── shared/              # 共享类型、工具函数
│   └── ui/                  # 共享 UI 组件库
├── docs/
│   ├── product/             # 产品文档
│   ├── dev/                 # 开发文档
│   └── api/                 # API 文档
├── scripts/                 # 部署脚本
└── docker-compose.yml       # 本地开发环境
```

---

## 3. 环境要求

### 本地开发环境
- macOS 14+ (ARM64)
- Node.js 20 LTS
- pnpm 8+
- Docker Desktop
- Git

### 服务端生产环境
- Ubuntu 22.04 LTS
- PostgreSQL 16
- Redis 7
- Meilisearch 1.x
- Node.js 20 LTS
- PM2
- Nginx

---

## 4. 本地开发环境搭建

### 4.1 安装依赖

```bash
# 安装 pnpm
npm install -g pnpm

# 克隆仓库
git clone <repo-url> maik
cd maik

# 安装所有依赖
pnpm install
```

### 4.2 启动基础设施

```bash
# 启动 PostgreSQL + Redis + Meilisearch
docker-compose up -d
```

### 4.3 配置环境变量

```bash
# apps/api/.env
cp apps/api/.env.example apps/api/.env
# 编辑 .env 文件

# apps/web/.env.local
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local 文件

# apps/app/.env.local
cp apps/app/.env.example apps/app/.env.local
# 编辑 .env.local 文件
```

### 4.4 启动开发服务器

```bash
# 方式1: 同时启动所有服务
pnpm dev

# 方式2: 分别启动
pnpm --filter api dev      # API: http://localhost:3001
pnpm --filter web dev      # Web: http://localhost:3000
pnpm --filter app dev      # App: http://localhost:3002
```

---

## 5. 开发规范

### 5.1 代码规范

- **TypeScript**: 严格模式开启
- **ESLint**: 使用项目配置
- **Prettier**: 统一代码格式
- **提交规范**: Conventional Commits

```bash
# 提交示例
feat: 添加简历解析功能
fix: 修复职位搜索分页 bug
docs: 更新 API 文档
refactor: 重构用户认证模块
```

### 5.2 分支管理

```
main        # 生产分支
  ↓
develop     # 开发分支
  ↓
feature/*   # 功能分支
  ↓
hotfix/*    # 紧急修复
```

### 5.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件/目录 | kebab-case | `user-profile.tsx` |
| 组件 | PascalCase | `UserProfile` |
| 函数/变量 | camelCase | `getUserProfile` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 类型/接口 | PascalCase | `UserProfileProps` |
| API 端点 | kebab-case | `/api/v1/user-profiles` |
| 数据库表 | snake_case | `user_profiles` |
| 数据库字段 | snake_case | `created_at` |

---

## 6. 数据库规范

### 6.1 迁移管理

使用 TypeORM 或 Prisma 进行数据库迁移。

```bash
# 生成迁移
pnpm --filter api migration:generate --name=add_user_table

# 执行迁移
pnpm --filter api migration:run

# 回滚迁移
pnpm --filter api migration:revert
```

### 6.2 字段命名

- 主键: `id` (UUID)
- 创建时间: `created_at`
- 更新时间: `updated_at`
- 软删除: `deleted_at`
- 外键: `{table}_id`

### 6.3 索引规范

- 外键自动创建索引
- 搜索字段添加索引
- 复合查询考虑联合索引

---

## 7. API 规范

### 7.1 接口格式

```typescript
// 统一响应格式
interface ApiResponse<T> {
  code: number;        // 业务状态码
  message: string;     // 提示信息
  data: T;            // 数据
  timestamp: number;   // 时间戳
}

// 分页响应
interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 7.2 HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

### 7.3 业务状态码

```typescript
enum BusinessCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  VALIDATION_ERROR = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_ERROR = 500,
  
  // 业务自定义
  RESUME_PARSE_FAILED = 1001,
  JOB_NOT_OPEN = 2001,
  INSUFFICIENT_BALANCE = 3001,
}
```

---

## 8. 部署流程

### 8.1 CI/CD 配置

使用 GitHub Actions 实现自动化部署。

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: self-hosted  # 使用本机作为 runner
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build API
        run: pnpm --filter api build
        
      - name: Build Web
        run: pnpm --filter web build
        
      - name: Build App
        run: pnpm --filter app build
        
      - name: Deploy to server
        run: |
          rsync -avz --delete apps/api/dist/ user@server:/opt/maik/api/
          rsync -avz --delete apps/web/dist/ user@server:/opt/maik/web/
          rsync -avz --delete apps/app/dist/ user@server:/opt/maik/app/
          
      - name: Restart services
        run: |
          ssh user@server "cd /opt/maik && pm2 reload all"
```

### 8.2 服务器配置

#### PostgreSQL 配置优化 (2核4G)

```conf
# /etc/postgresql/16/main/postgresql.conf
max_connections = 50
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
work_mem = 8MB
timezone = 'Asia/Shanghai'
```

#### Redis 配置

```conf
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Meilisearch 配置

```bash
# 使用 systemd 管理
meilisearch --master-key="your-master-key" --http-addr="127.0.0.1:7700"
```

#### PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'maik-api',
      script: '/opt/maik/api/main.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/maik/api-error.log',
      out_file: '/var/log/maik/api-out.log'
    },
    {
      name: 'maik-web',
      script: '/opt/maik/web/server.js',
      instances: 1,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

#### Nginx 配置

```nginx
# /etc/nginx/sites-available/maik
upstream maik_api {
    server 127.0.0.1:3001;
}

upstream maik_web {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name maik.example.com;
    
    # 强制 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name maik.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # API 代理
    location /api/ {
        proxy_pass http://maik_api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Web 端
    location / {
        proxy_pass http://maik_web;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 9. 环境变量模板

### 9.1 API 环境变量 (.env)

```env
# 应用配置
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1

# 数据库
DATABASE_URL=postgresql://maik:password@localhost:5432/maik?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=master-key

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# COS
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
COS_BUCKET=maik-xxx
COS_REGION=ap-guangzhou
COS_DOMAIN=https://maik-xxx.cos.ap-guangzhou.myqcloud.com

# 短信/邮件服务
SMS_ACCESS_KEY=xxx
SMS_SECRET_KEY=xxx
```

### 9.2 Web 环境变量 (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_COS_DOMAIN=https://maik-xxx.cos.ap-guangzhou.myqcloud.com
```

---

## 10. 常用命令

```bash
# 开发
pnpm dev              # 启动所有服务
pnpm dev:api          # 只启动 API
pnpm dev:web          # 只启动 Web
pnpm dev:app          # 只启动 App

# 构建
pnpm build            # 构建所有
pnpm build:api        # 构建 API
pnpm build:web        # 构建 Web

# 测试
pnpm test             # 运行所有测试
pnpm test:api         # 运行 API 测试
pnpm test:e2e         # 运行 E2E 测试

# 代码检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复
pnpm format           # Prettier 格式化

# 数据库
pnpm db:migrate       # 执行迁移
pnpm db:generate      # 生成迁移
pnpm db:seed          # 填充数据
pnpm db:reset         # 重置数据库

# 部署
pnpm deploy           # 执行部署脚本
```

---

## 11. 故障排查

### 11.1 本地开发

| 问题 | 解决方案 |
|------|----------|
| 端口被占用 | `lsof -ti:3000 \| xargs kill -9` |
| 数据库连接失败 | 检查 Docker 是否启动 `docker-compose ps` |
| 依赖安装失败 | 清除缓存 `pnpm store prune` |
| 类型错误 | 重启 TS 服务 `Cmd+Shift+P → TypeScript: Restart` |

### 11.2 生产环境

| 问题 | 解决方案 |
|------|----------|
| PM2 启动失败 | 查看日志 `pm2 logs maik-api` |
| Nginx 502 | 检查 API 是否运行 `pm2 status` |
| 数据库连接池满 | 检查连接数 `SELECT count(*) FROM pg_stat_activity;` |
| 内存不足 | 检查进程内存 `pm2 monit` |

---

## 12. 相关文档

- [产品手册](./product-manual.md)
- [API 文档](./api/README.md)
- [数据模型](./data-model.md)
- [部署指南](./deployment.md)
