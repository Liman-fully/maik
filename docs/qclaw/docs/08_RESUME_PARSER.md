# 脉刻 maik — 简历解析 Pipeline

> 处理100万份死简历的完整技术方案

---

## 一、支持的简历格式

| 格式 | 预估占比 | 处理方式 |
|------|---------|---------|
| 网页导出HTML | 最多 | Marker → Markdown |
| PDF文字型 | 多 | PyMuPDF 直接提取 |
| PDF扫描件/图片 | 较多 | PaddleOCR |
| Word (.doc/.docx) | 中 | MarkItDown → Markdown |
| PPT格式PDF（设计类） | 少 | pdf2image + PaddleOCR |
| Excel | 少 | openpyxl |
| 邮件附件（各种格式） | 中 | imaplib提取 → 路由对应解析器 |

---

## 二、解析 Pipeline

```
原始简历
   ↓
┌──────────────────────────────────┐
│         格式识别层                 │
│  HTML / PDF文字 / PDF图片 / Word / Excel / 邮件附件  │
└───────────────┬──────────────────┘
                ↓
┌───────────────┴──────────────────┐
│           解析器路由               │
└───────────────┬──────────────────┘
                ↓
  ┌─────────────┼──────────────┐
  ↓             ↓              ↓
网页简历    文档简历       表格简历
  ↓             ↓              ↓
Marker      MarkItDown     openpyxl
  ↓             ↓              ↓
  └─────────────┴──────────────┘
                ↓
          统一 Markdown / 纯文本
                ↓
    ┌───────────────────────────┐
    │     结构化提取（分层）       │
    │                           │
    │  Layer 1: 正则规则         │
    │    姓名/电话/邮箱/学历/年限  │
    │                           │
    │  Layer 2: 阿里开源NLP模型  │
    │    工作经历/项目经历/技能   │
    │                           │
    │  Layer 3: DeepSeek 兜底    │
    │    长尾字段/标签生成/评分   │
    └───────────────────────────┘
                ↓
        JSON 标准化简历档案
                ↓
        PostgreSQL + Meilisearch
```

---

## 三、工具选型详情

### OCR（图片/扫描件）
```bash
# PaddleOCR（推荐，中文强）
pip install paddlepaddle paddleocr

# 或轻量版（CPU友好）
pip install paddlepaddle-gpu pppaddleocr
```

### 格式转换
```bash
# MarkItDown（微软开源，Word/PPT/Excel → Markdown）
pip install markitdown

# Marker（PDF → Markdown，保留表格/多栏）
pip install marker-pdf

# Pandoc（通用格式转换）
brew/apt install pandoc
```

### NLP 解析
```bash
# 阿里开源简历解析（中文最强）
git clone https://github.com/alibaba-NLP/ResumeParser.git
# 或使用阿里云 NLP API
```

### DeepSeek 兜底 Prompt
```python
SYSTEM_PROMPT = """
你是一个专业HR简历解析助手。给定一份简历的原始文本，
请提取并返回以下JSON格式（只返回JSON，不要解释）：

{
  "name": "姓名",
  "phone": "手机号",
  "email": "邮箱",
  "city": "现居城市",
  "education": [{"school": "学校", "degree": "学历", "major": "专业", "start": "", "end": ""}],
  "work_experience": [{"company": "公司", "position": "职位", "start": "", "end": "", "description": ""}],
  "skills": ["技能1", "技能2"],
  "labels": ["标签1", "标签2"],
  "quality_score": 0-100,
  "parse_confidence": 0.0-1.0
}
"""
```

---

## 四、JSON 标准化 Schema

```typescript
interface Resume {
  resume_id: string;          // UUID
  source: string;             // "猎聘" | "邮箱" | "上传" | "导入"
  raw_text: string;           // 原始文本（保留，用于复查）
  name: string;
  phone?: string;
  email?: string;
  gender?: "男" | "女" | "未知";
  age?: number;
  city?: string;
  education: Education[];
  work_experience: WorkExperience[];
  skills: string[];
  labels: string[];           // ["互联网", "前端", "P7"]
  expected_salary_min?: number;
  expected_salary_max?: number;
  expected_cities?: string[];
  quality_score: number;       // 0-100
  parse_confidence: number;    // 0.0-1.0
  parse_source: string;       // "ali_nlp" | "deepseek" | "rule"
  raw_file_url?: string;      // COS原始文件URL
  created_at: string;
  updated_at: string;
}
```

---

## 五、置信度分级处理

```typescript
const CONFIDENCE_THRESHOLD = {
  HIGH: 0.9,      // 直接入库
  MEDIUM: 0.7,    // 入库 + 标记待复核
  LOW: 0.5,       // 入库 + 人工复核队列
  REJECT: 0.0,     // 解析失败，进入错误队列
}
```

---

## 六、100万简历导入计划

### 分批导入策略
```javascript
// 每次导入1000条，间隔10秒，防止OOM
async function importBatch(resumes, batchSize = 1000, interval = 10000) {
  for (let i = 0; i < resumes.length; i += batchSize) {
    const batch = resumes.slice(i, i + batchSize);
    await indexToMeilisearch(batch);
    await saveToPostgreSQL(batch);
    console.log(`已导入 ${i + batchSize} / ${resumes.length}`);
    await sleep(interval);
  }
}
```

### 进度监控
```bash
# 查看导入进度
curl http://127.0.0.1:7700/indexes/resumes/stats
```
