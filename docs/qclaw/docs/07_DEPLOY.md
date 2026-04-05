# 脉刻 maik — 部署手册

> ⚠️ 2核4G服务器必读：OOM问题根源+解决方案

---

## 一、OOM 问题诊断与解决

### 问题表现
- pm2 挂死
- SSH 连接卡死
- 服务无响应

### 根本原因
2核4G服务器同时跑：Meilisearch（~2G）+ Node.js（~1G）+ OS（~1G）= 4G+，内存溢出。

### 解决方案（按优先级）

**立即生效（不改配置会一直挂）：**

```bash
# 1. Meilisearch 启动加内存限制
./meilisearch \
  --max-memory-ratio 0.5 \
  --max-indexing-threads 1

# 2. pm2 ecosystem.config.js 设置内存上限
max_memory_restart: '512M'

# 3. 查看当前内存占用
free -h
pm2 list
```

**彻底解决（推荐）：**
升级服务器到 4核8G，资源问题永远消除。

---

## 二、服务器环境准备

```bash
# 1. 安装 Node.js（通过 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# 2. 安装 Meilisearch
wget https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-linux-amd64
chmod +x meilisearch-linux-amd64

# 3. 安装 PostgreSQL 客户端
apt install postgresql-client -y

# 4. 安装 pm2
npm install -g pm2

# 5. 克隆代码
git clone https://github.com/your-org/maik.git
cd maik
npm install
```

---

## 三、服务启动顺序

```bash
# 1. 先启动 Meilisearch（带内存限制）
./meilisearch-linux-amd64 \
  --http-addr 127.0.0.1:7700 \
  --env production \
  --no-analytics \
  --db-path ./data.ms \
  --max-memory-ratio 0.5 \
  --max-indexing-threads 1 \
  --master-key "YOUR_MASTER_KEY" &

# 2. 验证 Meilisearch 启动成功
curl http://127.0.0.1:7700/health
# 应返回 {"status":"available"}

# 3. 构建并启动 API
cd packages/api
npm run build
pm2 start ecosystem.config.js

# 4. 验证 API
curl http://localhost:3000/health

# 5. 启动简历索引脚本
node infra/meilisearch/indexer.js
```

---

## 四、环境变量配置

```bash
# /etc/environment 或 .env
NODE_ENV=production

# 数据库
DATABASE_URL=postgresql://user:password@host:5432/maik

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_API_KEY=YOUR_MASTER_KEY

# Redis
REDIS_URL=redis://host:6379

# COS
COS_SECRET_ID=your_id
COS_SECRET_KEY=your_key
COS_BUCKET=maik-files
COS_REGION=ap-guangzhou

# JWT
JWT_SECRET=your_jwt_secret

# DeepSeek（简历解析用）
DEEPSEEK_API_KEY=sk-xxx
```

---

## 五、域名 + HTTPS 配置

```bash
# 1. 腾讯云 DNSPod 解析域名
A记录 @ your_server_ip
A记录 www your_server_ip

# 2. 用 Certbot 申请 Let's Encrypt 证书
apt install certbot python3-certbot-nginx -y
certbot --nginx -d maik.com -d www.maik.com

# 3. Nginx 反向代理
# /etc/nginx/sites-available/maik
server {
    listen 80;
    server_name maik.com www.maik.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name maik.com www.maik.com;

    ssl_certificate /etc/letsencrypt/live/maik.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/maik.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 4. 重启 Nginx
nginx -t && systemctl reload nginx
```

---

## 六、Vercel 部署（营销站+招聘者Web）

```bash
# 营销站部署
cd apps/marketing
vercel --prod

# 招聘者Web部署
cd apps/web
vercel --prod
```

环境变量在 Vercel Dashboard → Settings → Environment Variables 中配置。

---

## 七、健康检查脚本

```bash
#!/bin/bash
# check.sh — 保活检查

# Meilisearch
curl -s http://127.0.0.1:7700/health || echo "MEILI DOWN"

# API
curl -s http://localhost:3000/health || echo "API DOWN"

# pm2 自动重启
pm2 list
```

加入 crontab 每5分钟执行：
```bash
*/5 * * * * /path/to/check.sh >> /var/log/health.log 2>&1
```

---

## 八、备份策略

| 数据 | 备份方式 | 频率 |
|------|---------|------|
| PostgreSQL | 腾讯云自动备份 | 每日 |
| Meilisearch索引 | 快照命令 | 每周 |
| COS文件 | 腾讯云多版本 | 自动 |
| 代码 | GitHub | 每次push |
