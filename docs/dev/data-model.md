# 脉刻数据模型文档

## ER 图概览

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Resume    │────<│ Application │
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                         │
       │         ┌─────────────┐                │
       └────────<│   Company   │<───────────────┘
       │         └──────┬──────┘
       │                │
       │         ┌──────┴──────┐
       │         │ CompanyMember│
       │         └─────────────┘
       │
       │         ┌─────────────┐     ┌─────────────┐
       └────────<│ TalentPool  │────<│  Referral   │
                 └─────────────┘     └──────┬──────┘
                                             │
                                       ┌─────┴─────┐
                                       │    Job    │
                                       └───────────┘
```

## 实体详细说明

### 1. User (用户)

用户是系统的核心实体，一个用户可以同时拥有多个角色。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| phone | String | 手机号，唯一 |
| email | String | 邮箱，唯一 |
| password | String | 加密后的密码 |
| nickname | String | 昵称 |
| avatar | String | 头像 URL |
| realName | String | 真实姓名 |
| idCard | String | 身份证号 |
| isJobSeeker | Boolean | 是否是求职者 |
| isRecruiter | Boolean | 是否是招聘者 |
| isHeadhunter | Boolean | 是否是猎头 |
| isTalentScout | Boolean | 是否是人才伯乐 |
| status | Enum | 用户状态 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| deletedAt | DateTime | 软删除时间 |

**关联关系：**
- 1:N Resume (一个用户有多份简历)
- 1:N Job (一个招聘者发布多个职位)
- N:M Company (通过 CompanyMember 关联)
- 1:N Application (一个用户有多条投递记录)
- 1:N TalentPool (一个伯乐有多个人才库)
- 1:N Referral (一个伯乐有多条推荐记录)

---

### 2. Resume (简历)

简历是求职者的核心信息载体，支持多份简历。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 所属用户 |
| realName | String | 真实姓名 |
| gender | Enum | 性别 |
| birthDate | DateTime | 出生日期 |
| phone | String | 联系电话 |
| email | String | 联系邮箱 |
| location | String | 当前城市 |
| jobTitle | String | 期望职位 |
| expectedSalary | Int | 期望月薪（元）|
| expectedCities | String[] | 期望城市 |
| workExperiences | JSON | 工作经历 |
| educations | JSON | 教育经历 |
| projects | JSON | 项目经历 |
| skills | String[] | 技能标签 |
| summary | String | 自我介绍 |
| attachmentUrl | String | 附件简历 URL |
| searchId | String | Meilisearch 索引 ID |
| visibility | Enum | 可见性 |
| isDefault | Boolean | 是否默认简历 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**工作经历 JSON 结构：**
```json
[
  {
    "company": "公司名称",
    "title": "职位",
    "startDate": "2020-01",
    "endDate": "2023-12",
    "isCurrent": false,
    "description": "工作描述"
  }
]
```

**教育经历 JSON 结构：**
```json
[
  {
    "school": "学校名称",
    "major": "专业",
    "degree": "学历",
    "startDate": "2016-09",
    "endDate": "2020-06"
  }
]
```

---

### 3. Company (企业)

企业信息，支持企业认证。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | String | 企业全称 |
| shortName | String | 企业简称 |
| logo | String | Logo URL |
| industry | String | 所属行业 |
| scale | Enum | 企业规模 |
| stage | Enum | 发展阶段 |
| description | String | 企业介绍 |
| website | String | 官网 |
| location | String | 所在地 |
| licenseNo | String | 营业执照号 |
| licenseImage | String | 营业执照图片 |
| verifiedAt | DateTime | 认证时间 |
| status | Enum | 认证状态 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**企业规模枚举：**
- TINY: 0-20人
- SMALL: 20-99人
- MEDIUM: 100-499人
- LARGE: 500-999人
- XLARGE: 1000-9999人
- GIANT: 10000人以上

---

### 4. Job (职位)

职位信息，由招聘者发布。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| companyId | UUID | 所属企业 |
| publisherId | UUID | 发布者 |
| title | String | 职位名称 |
| department | String | 所属部门 |
| type | Enum | 工作类型 |
| minSalary | Int | 最低薪资 |
| maxSalary | Int | 最高薪资 |
| salaryMonths | Int | 薪资月数 |
| cities | String[] | 工作城市 |
| experience | Enum | 经验要求 |
| education | Enum | 学历要求 |
| tags | String[] | 职位标签 |
| description | String | 职位描述 |
| requirements | String[] | 岗位要求 |
| hasReward | Boolean | 是否有悬赏 |
| rewardAmount | Int | 悬赏金额 |
| rewardType | Enum | 悬赏类型 |
| searchId | String | Meilisearch 索引 ID |
| status | Enum | 职位状态 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| expiredAt | DateTime | 过期时间 |

---

### 5. Application (投递)

简历投递记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| jobId | UUID | 投递职位 |
| resumeId | UUID | 投递简历 |
| userId | UUID | 投递用户 |
| source | Enum | 投递来源 |
| referralId | UUID | 关联推荐 ID |
| status | Enum | 投递状态 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**投递状态流转：**
```
PENDING → VIEWED → INTERVIEWING → OFFERED → HIRED
   ↓
REJECTED / WITHDRAWN
```

---

### 6. TalentPool (人才库)

伯乐的人才库，存储推荐候选人信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| userId | UUID | 所属伯乐 |
| name | String | 人才姓名 |
| phone | String | 联系电话 |
| email | String | 联系邮箱 |
| resumeId | UUID | 关联简历 ID |
| tags | String[] | 人才标签 |
| notes | String | 备注 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

---

### 7. Referral (推荐)

伯乐向招聘者推荐人才的记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| jobId | UUID | 推荐职位 |
| talentPoolId | UUID | 人才库记录 |
| referrerId | UUID | 推荐人 |
| message | String | 推荐语 |
| status | Enum | 推荐状态 |
| rewardAmount | Int | 实际悬赏金额 |
| rewardStatus | Enum | 悬赏发放状态 |
| rewardedAt | DateTime | 悬赏发放时间 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**推荐状态流转：**
```
PENDING → ACCEPTED → INTERVIEWING → HIRED (reward paid)
   ↓
REJECTED / EXPIRED
```

---

### 8. Message (消息)

站内消息系统。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| senderId | UUID | 发送者 |
| receiverId | UUID | 接收者 |
| type | Enum | 消息类型 |
| content | String | 消息内容 |
| businessType | Enum | 关联业务类型 |
| businessId | String | 关联业务 ID |
| isRead | Boolean | 是否已读 |
| readAt | DateTime | 阅读时间 |
| createdAt | DateTime | 创建时间 |

---

## 索引设计

### 数据库索引

| 表 | 字段 | 类型 | 说明 |
|---|------|------|------|
| users | phone | Unique | 手机号唯一 |
| users | email | Unique | 邮箱唯一 |
| resumes | userId | Index | 用户简历查询 |
| resumes | searchId | Unique | 搜索索引关联 |
| jobs | companyId | Index | 企业职位查询 |
| jobs | publisherId | Index | 发布者职位查询 |
| jobs | searchId | Unique | 搜索索引关联 |
| applications | jobId | Index | 职位投递查询 |
| applications | userId | Index | 用户投递查询 |
| applications | resumeId | Index | 简历投递查询 |
| talent_pools | userId | Index | 伯乐人才库查询 |
| referrals | jobId | Index | 职位推荐查询 |
| referrals | referrerId | Index | 伯乐推荐查询 |
| messages | receiverId | Index | 收件箱查询 |
| messages | senderId | Index | 发件箱查询 |

### Meilisearch 索引

**resumes 索引：**
- Searchable: realName, jobTitle, skills, summary, location
- Filterable: gender, expectedCities, skills, minSalary, maxSalary
- Sortable: createdAt, updatedAt

**jobs 索引：**
- Searchable: title, department, description, requirements, tags, companyName
- Filterable: type, cities, experience, education, minSalary, maxSalary, hasReward, status
- Sortable: createdAt, minSalary, maxSalary

---

## 数据流说明

### 简历上传流程

```
1. 用户上传简历文件 (PDF/Word/图片)
2. 文件上传至 COS
3. 调用简历解析服务提取信息
4. 创建 Resume 记录
5. 同步到 Meilisearch 索引
```

### 职位发布流程

```
1. 招聘者填写职位信息
2. 创建 Job 记录
3. 同步到 Meilisearch 索引
4. 匹配算法推荐候选人
```

### 伯乐推荐流程

```
1. 伯乐从人才库选择候选人
2. 选择目标职位
3. 创建 Referral 记录
4. 招聘者收到推荐通知
5. 招聘者接受/拒绝推荐
6. 候选人入职后发放悬赏
```
