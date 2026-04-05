# 脉刻 maik — API 接口规范

> Fastify + TypeScript + Zod 验证

---

## 一、Base URL

```
开发环境: http://localhost:3000/api
生产环境: https://api.maik.com/api
```

---

## 二、认证

所有需要认证的接口，在 Header 中传递 JWT：

```
Authorization: Bearer <jwt_token>
```

JWT Payload：
```typescript
{
  sub: string;      // user_id
  role: "job_seeker" | "recruiter" | "bolin";
  iat: number;
  exp: number;
}
```

---

## 三、用户相关

### POST /auth/register
注册
```typescript
// Request
{ phone: string; password: string; role: "job_seeker" | "recruiter" }

// Response 201
{ user_id: string; token: string; }
```

### POST /auth/login
登录
```typescript
// Request
{ phone: string; password: string; }

// Response 200
{ user_id: string; token: string; role: string; }
```

### GET /auth/me
获取当前用户信息
```typescript
// Response 200
{
  user_id: string;
  phone: string;
  role: string;
  bolin_level: "B0" | "B1" | "B2" | "B3" | "B4";
  credits: number;
  created_at: string;
}
```

---

## 四、简历相关

### POST /resumes
创建/上传简历
```typescript
// Request (multipart/form-data)
{
  file: File;                    // PDF/Word/图片
  is_anonymous: boolean;         // 是否匿名
}

// Response 201
{ resume_id: string; quality_score: number; }
```

### GET /resumes
获取简历列表（当前用户）
```typescript
// Query
{ page?: number; limit?: number; }

// Response 200
{
  resumes: Resume[];
  total: number;
  page: number;
  limit: number;
}
```

### GET /resumes/:id
获取简历详情
```typescript
// Response 200
Resume
```

### GET /resumes/search
搜索简历（Meilisearch）
```typescript
// Query
{
  q: string;                    // 搜索关键词
  city?: string;                // 城市过滤
  experience_min?: number;      // 最低工作年限
  experience_max?: number;       // 最高工作年限
  labels?: string;              // 标签（逗号分隔）
  degree?: string;              // 学历
  salary_min?: number;          // 期望最低薪资
  sort?: "quality_score" | "experience_years" | "created_at";
  page?: number;
  limit?: number;
}

// Response 200
{
  hits: Resume[];
  total: number;
  page: number;
  limit: number;
  processing_time_ms: number;
}
```

---

## 五、伯乐相关

### POST /bolin/apply
申请伯乐身份
```typescript
// Request
{}

// Response 200
{ bolin_level: "B0"; credits: number; }
```

### GET /bolin/stats
伯乐数据统计
```typescript
// Response 200
{
  total_referrals: number;
  successful_referrals: number;
  credits: number;
  bolin_level: string;
  monthly_stats: { month: string; referrals: number; }[];
}
```

### POST /bolin/refer
发起推荐
```typescript
// Request
{
  resume_id: string;
  job_id: string;
  reason: string;              // ≥20字推荐理由
}

// Response 201
{ referral_id: string; status: "pending"; }
```

### GET /bolin/referrals
推荐记录
```typescript
// Query
{ status?: "pending" | "accepted" | "rejected"; page?: number; limit?: number; }

// Response 200
{ referrals: Referral[]; total: number; }
```

---

## 六、职位相关

### POST /jobs
发布职位（招聘者）
```typescript
// Request
{
  title: string;
  company: string;
  city: string;
  salary_min: number;
  salary_max: number;
  description: string;
  requirements: string[];
  labels: string[];
}

// Response 201
{ job_id: string; status: "published"; }
```

### GET /jobs
获取职位列表
```typescript
// Query
{
  q?: string;
  city?: string;
  salary_min?: number;
  labels?: string;
  page?: number;
  limit?: number;
}

// Response 200
{ jobs: Job[]; total: number; }
```

### GET /jobs/:id
获取职位详情
```typescript
// Response 200
Job
```

---

## 七、订单相关

### POST /orders/download
购买简历下载
```typescript
// Request
{ resume_id: string; }

// Response 200
{ order_id: string; amount: 5; download_url: string; }
```

### GET /orders
订单列表
```typescript
// Response 200
{ orders: Order[]; }
```

---

## 八、错误响应格式

```typescript
// 所有错误响应
{
  error: {
    code: string;       // "AUTH_FAILED" | "NOT_FOUND" | "VALIDATION_ERROR"
    message: string;     // 人类可读错误信息
    details?: any;       // Zod 验证错误详情
  }
}
```
