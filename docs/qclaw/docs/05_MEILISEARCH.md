# 脉刻 maik — Meilisearch 配置

> 中文分词 + 百万简历检索

---

## 一、索引初始化

```bash
# 创建索引
curl -X POST 'http://127.0.0.1:7700/indexes' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"uid": "resumes", "primaryKey": "resume_id"}'
```

---

## 二、索引设置

```bash
curl -X PATCH 'http://127.0.0.1:7700/indexes/resumes/settings' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "searchableAttributes": [
      "name",
      "skills",
      "work_company",
      "work_position", 
      "work_description",
      "education_school",
      "labels"
    ],
    "filterableAttributes": [
      "city",
      "experience_years",
      "expected_salary_range",
      "degree",
      "labels",
      "source",
      "quality_score",
      "bolin_level"
    ],
    "sortableAttributes": [
      "quality_score",
      "experience_years",
      "created_at"
    ],
    "rankingRules": [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
      "quality_score:desc"
    ],
    "typoTolerance": {
      "enabled": true,
      "minWordSizeForTypos": {
        "oneTypo": 4,
        "twoTypos": 8
      }
    }
  }'
```

---

## 三、中文分词（同义词配置）

```bash
curl -X PATCH 'http://127.0.0.1:7700/indexes/resumes/settings' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "synonyms": {
      "前端": ["前端开发", "Web开发", "FE", "Front-end"],
      "后端": ["后端开发", "Backend", "Java后端", "Go后端"],
      "Java": ["JAVA", "java开发", "Java工程师"],
      "Python": ["PYTHON", "python开发"],
      "PM": ["产品经理", "Product Manager"],
      "算法": ["算法工程师", "AI工程师", "机器学习"],
      "测试": ["QA", "测试工程师", "Test"],
      "运营": ["产品运营", "用户运营", "内容运营"],
      "HR": ["人力资源", "招聘", "人事"],
      "简历": ["履历", "CV"],
      "猎头": ["猎头顾问", "人才顾问", "招聘顾问"],
      "北京": ["帝都"],
      "上海": ["魔都"],
      "深圳": ["鹏城"],
      "杭州": ["阿里城"]
    }
  }'
```

---

## 四、文档导入格式

Meilisearch 接收的是扁平化的 JSON，简历的嵌套字段需要展平：

```typescript
// PostgreSQL 查询结果 → Meilisearch 文档
function transformResumeForMeili(r: any) {
  return {
    resume_id: r.id,
    user_id: r.user_id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    city: r.city,
    // 工作经历展平
    work_company: r.work_experience?.map((w: any) => w.company).join(' ') || '',
    work_position: r.work_experience?.map((w: any) => w.position).join(' ') || '',
    work_description: r.work_experience?.map((w: any) => w.description).join(' ') || '',
    work_years: r.work_experience?.length || 0,
    experience_years: calculateExperienceYears(r.work_experience),
    // 教育展平
    education_school: r.education?.map((e: any) => e.school).join(' ') || '',
    degree: r.education?.[0]?.degree || '',
    // 技能和标签
    skills: r.skills || [],
    labels: r.labels || [],
    // 薪资范围
    expected_salary_range: `${r.expected_salary_min || 0}-${r.expected_salary_max || 999999}`,
    // 来源
    source: r.source,
    quality_score: r.quality_score,
    bolin_level: r.user?.bolin_level || 'B0',
    created_at: r.created_at,
  }
}
```

---

## 五、职位搜索索引

```bash
curl -X POST 'http://127.0.0.1:7700/indexes' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"uid": "jobs", "primaryKey": "job_id"}'

curl -X PATCH 'http://127.0.0.1:7700/indexes/jobs/settings' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "searchableAttributes": ["title", "company", "description", "requirements", "labels"],
    "filterableAttributes": ["city", "salary_min", "salary_max", "labels", "status", "user_id"],
    "sortableAttributes": ["created_at", "salary_max", "view_count"]
  }'
```

---

## 六、职位-简历交叉匹配查询

招聘者粘贴一段职位描述，系统自动匹配最合适的简历：

```typescript
async function matchResumesToJob(jobDescription: string, filters: any) {
  const results = await meili.index('resumes').search(jobDescription, {
    limit: 20,
    filter: buildFilters(filters),
    attributesToRetrieve: ['resume_id', 'name', 'skills', 'work_position', 'quality_score'],
  });
  return results;
}
```
