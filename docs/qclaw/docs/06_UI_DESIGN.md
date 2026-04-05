# 脉刻 maik — 视觉设计规范

> Apple风格极简设计系统，适用于 RN App + Web后台 + 浏览器插件

---

## 一、设计原则

**核心：克制、留白、一致。**

- 颜色不超过5种
- 圆角只有3个规格
- 阴影极轻，层次靠留白
- 不装饰，除非装饰有意义

---

## 二、设计令牌（Design Tokens）

```css
/* 全局CSS变量，App和Web共用 */
:root {
  /* 颜色 — 极度克制 */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F7;
  --color-bg-tertiary: #F0F0F2;
  
  --color-text: #1D1D1F;
  --color-text-secondary: #86868B;
  --color-text-muted: #A1A1A6;
  
  --color-accent: #0071E3;
  --color-accent-hover: #0077ED;
  --color-accent-light: rgba(0,113,227,0.08);
  
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-error: #FF3B30;
  
  --color-border: #E5E5E7;
  --color-border-light: #F2F2F7;
  
  /* 字体 */
  --font-en: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-zh: 'PingFang SC', 'Noto Sans SC', sans-serif;
  --font-body: var(--font-zh), var(--font-en);
  
  /* 字号 — 层级分明 */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 17px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  
  /* 圆角 — 两个规格 */
  --radius-sm: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* 阴影 — 极轻 */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
  --shadow-modal: 0 20px 40px rgba(0,0,0,0.08);
  --shadow-button: 0 1px 2px rgba(0,0,0,0.04);
  
  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 三、组件规范

### 按钮

```tsx
// Primary — 主按钮
<button className="
  bg-[#0071E3] text-white
  px-4 py-2.5 rounded-[8px]
  text-[15px] font-medium
  hover:bg-[#0077ED]
  active:scale-[0.98]
  transition-all duration-150
">
  主要操作
</button>

// Secondary — 次要按钮
<button className="
  bg-[#F5F5F7] text-[#1D1D1F]
  px-4 py-2.5 rounded-[8px]
  text-[15px] font-medium
  hover:bg-[#E8E8ED]
">
  次要操作
</button>

// Ghost — 文字按钮
<button className="
  text-[#0071E3]
  text-[15px] font-medium
  hover:opacity-80
">
  文字链接
</button>
```

### 卡片

```tsx
// 标准卡片
<div className="
  bg-white rounded-[16px]
  p-[16px]
  shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]
">
  {children}
</div>

// 简历卡片
<div className="
  bg-white rounded-[16px]
  p-4
  border border-[#E5E5E7]
  hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]
  transition-shadow duration-200
">
```

### 输入框

```tsx
<input className="
  w-full
  px-3 py-2.5
  bg-[#F5F5F7]
  rounded-[8px]
  text-[15px]
  text-[#1D1D1F]
  placeholder:text-[#86868B]
  focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3]
  border border-transparent
  transition-all duration-150
"/>
```

### 标签/徽章

```tsx
// 技能标签
<span className="
  inline-flex items-center
  px-2.5 py-1
  bg-[#F5F5F7]
  text-[#1D1D1F]
  text-[12px] font-medium
  rounded-full
">
  Vue
</span>

// 伯乐等级
<span className="
  inline-flex items-center gap-1
  px-2.5 py-1
  bg-[#0071E3]/10
  text-[#0071E3]
  text-[12px] font-semibold
  rounded-full
">
  <StarIcon /> B2
</span>
```

---

## 四、RN App 布局

### 底部Tab栏
```
┌─────────────────────────────────┐
│                                 │
│         内容区域                 │
│         (flex-1)               │
│                                 │
├─────────────────────────────────┤
│  🏠 首页   🔍 搜索   💬 消息  👤 我的 │
│  (4等分，图标+文字)             │
└─────────────────────────────────┘
高度: 56px + safe-area-bottom
图标: 24px，文字: 10px
```

### 页面间距规范
```
padding: 16px（左右）
gap: 12px（列表项间距）
card-gap: 16px（卡片间距）
section-gap: 24px（区块间距）
```

---

## 五、Web后台布局

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: 56px高，白色，边框线分隔                          │
├────────────┬───────────────────────────────────────────┤
│            │                                            │
│  SIDEBAR   │           MAIN CONTENT                    │
│  200px宽   │                                            │
│  白色背景   │  最大宽度: 1200px（居中）                   │
│  图标+文字  │  padding: 32px                          │
│            │  数据表格：斑马纹+hover高亮                 │
│            │                                            │
└────────────┴───────────────────────────────────────────┘
```

### 桌面端 vs 移动端

```tsx
// 招聘者Web — 桌面为主
<div className="hidden md:flex"> {/* 桌面布局 */} </div>
<div className="flex md:hidden">   {/* 移动端：汉堡菜单 */} </div>

// RN App — 移动为主
<div className="flex flex-col">   {/* 天然移动布局 */} </div>
```

---

## 六、浏览器插件UI

```css
/* popup 最大宽度360px */
.extension-popup {
  width: 360px;
  min-height: 240px;
  max-height: 600px;
  overflow-y: auto;
  background: #FFFFFF;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 插件内部卡片 */
.ext-card {
  background: #F5F5F7;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

/* 插件按钮 */
.ext-btn {
  width: 100%;
  padding: 10px 16px;
  background: #0071E3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.ext-btn:hover { background: #0077ED; }
.ext-btn:disabled { background: #C7C7CC; cursor: not-allowed; }
```

---

## 七、AI设计工作流

### 工具链

| 步骤 | 工具 | 操作 |
|------|------|------|
| 1 | **v0.dev** | 描述需求，AI生成组件代码 |
| 2 | **shadcn/ui** | 组件标准化，npx安装 |
| 3 | **Cursor Agent** | 接入API逻辑 |
| 4 | **GitHub** | 代码版本管理 |

### v0.dev Prompt模板

```
设计一个[组件名]，Apple风格，极简主义：
- 背景色：白色
- 主文字：近黑色（#1D1D1F）
- 次要文字：苹果灰（#86868B）
- 强调色：Apple蓝（#0071E3）
- 圆角：8px（按钮）/ 16px（卡片）
- 阴影：极轻（0 1px 3px rgba(0,0,0,0.04)）
- 字体：PingFang SC（中文）/ SF Pro（英文）
- 不要任何装饰线、渐变、花哨效果

[具体描述组件内容和交互]
```

### shadcn/ui 安装命令

```bash
# 安装基础组件
npx shadcn@latest init
npx shadcn@latest add button card input badge avatar
npx shadcn@latest add dialog dropdown-menu tabs

# Apple风格覆盖（在 tailwind.config 中覆盖变量）
```

---

## 八、色彩应用示例

| 场景 | 背景 | 文字 | 边框 |
|------|------|------|------|
| 页面背景 | #FFFFFF | — | — |
| 次级背景 | #F5F5F7 | — | — |
| 卡片 | #FFFFFF | #1D1D1F | #E5E5E7 |
| 按钮Primary | #0071E3 | #FFFFFF | — |
| 按钮Secondary | #F5F5F7 | #1D1D1F | — |
| 输入框 | #F5F5F7 | #1D1D1F | — |
| 标签 | #F5F5F7 | #1D1D1F | — |
| 成功 | #34C759 | — | — |
| 警告 | #FF9500 | — | — |
| 错误 | #FF3B30 | — | — |
