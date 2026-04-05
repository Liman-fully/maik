# 脉刻 maik — 数据库表结构

> PostgreSQL 15+，腾讯云

---

## 一、ER 概览

```
users ──┬── user_resumes
        ├── jobs ──── job_labels
        ├── referrals ──── referral_messages
        ├── orders
        ├── credits_log
        ├── bolin_applications
        └── sessions
```

---

## 二、表结构

### users（用户表）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'job_seeker',  -- job_seeker | recruiter | both
  bolin_level VARCHAR(5) DEFAULT 'B0',
  credits INTEGER DEFAULT 0,
  city VARCHAR(50),
  language VARCHAR(10) DEFAULT 'zh',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_bolin_level ON users(bolin_level);
```

### resumes（简历表）
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL,          -- 'upload' | 'import' | 'email' | 'crawl'
  raw_file_url TEXT,                    -- COS URL
  raw_text TEXT,                        -- 原始文本（保留）
  name VARCHAR(100),
  gender VARCHAR(10),
  age INTEGER,
  phone VARCHAR(20),
  email VARCHAR(100),
  city VARCHAR(50),
  education JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  skills TEXT[],
  labels TEXT[],
  quality_score INTEGER DEFAULT 0,
  parse_confidence DECIMAL(3,2) DEFAULT 0,
  parse_source VARCHAR(50),
  is_anonymous BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_labels ON resumes USING GIN(labels);
CREATE INDEX idx_resumes_city ON resumes(city);
CREATE INDEX idx_resumes_quality ON resumes(quality_score DESC);
```

### jobs（职位表）
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  company VARCHAR(200) NOT NULL,
  city VARCHAR(50) NOT NULL,
  salary_min INTEGER NOT NULL,
  salary_max INTEGER NOT NULL,
  description TEXT,
  requirements TEXT[],
  labels TEXT[],
  status VARCHAR(20) DEFAULT 'published',  -- draft | published | closed
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_labels ON jobs USING GIN(labels);
CREATE INDEX idx_jobs_status ON jobs(status);
```

### referrals（推荐表）
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id),
  job_id UUID REFERENCES jobs(id),
  bolin_user_id UUID REFERENCES users(id),  -- 推荐人（伯乐）
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',     -- pending | accepted | rejected
  reject_reason VARCHAR(50),
  credit_reward INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);
CREATE INDEX idx_referrals_bolin ON referrals(bolin_user_id);
CREATE INDEX idx_referrals_job ON referrals(job_id);
CREATE INDEX idx_referrals_status ON referrals(status);
```

### orders（订单表）
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  resume_id UUID REFERENCES resumes(id),
  type VARCHAR(20) NOT NULL,    -- 'download' | 'job_publish' | 'expose_boost'
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | paid | refunded
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### credits_log（积分变动日志）
```sql
CREATE TABLE credits_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30) NOT NULL,   -- 'referral_success' | 'resume_viewed' | 'withdraw' | 'consume'
  amount INTEGER NOT NULL,     -- 正数=获得，负数=消耗
  balance INTEGER NOT NULL,    -- 变动后余额
  related_id UUID,             -- 关联订单/推荐ID
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_credits_log_user ON credits_log(user_id);
CREATE INDEX idx_credits_log_type ON credits_log(type);
```

### messages（消息表）
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES referrals(id),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT,
  type VARCHAR(20) DEFAULT 'text',  -- text | system | interview_node
  node_status VARCHAR(50),           -- resume_viewed | screening_pass | interview_scheduled | ...
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_referral ON messages(referral_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);
```

---

## 三、积分计算规则（数据库触发器）

```sql
-- 推荐成功：伯乐获得100积分
CREATE OR REPLACE FUNCTION on_referral_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE users SET credits = credits + 100
    WHERE id = NEW.bolin_user_id;
    
    INSERT INTO credits_log (user_id, type, amount, balance, related_id)
    VALUES (NEW.bolin_user_id, 'referral_success', 100,
      (SELECT credits FROM users WHERE id = NEW.bolin_user_id),
      NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_referral_accepted
AFTER UPDATE ON referrals
FOR EACH ROW EXECUTE FUNCTION on_referral_accepted();
```
