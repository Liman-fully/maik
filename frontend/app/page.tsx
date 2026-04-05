"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import TalentCard from "@/components/talent-card"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { talentService, jobService } from "@/services/talent"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Sparkles, 
  TrendingUp, 
  Clock,
  ChevronRight,
  ChevronDown,
  Plus,
  MapPin,
  Banknote,
  Briefcase,
  Wand2,
  X,
  Check
} from "lucide-react"

// 热门领域 - 按钮样式
const categories = [
  { name: "技术", count: 12580 },
  { name: "产品", count: 8420 },
  { name: "设计", count: 6230 },
  { name: "运营", count: 5180 },
  { name: "市场", count: 4560 },
  { name: "销售", count: 3890 },
  { name: "人事", count: 3200 },
  { name: "财务", count: 2800 },
]

// 三级职位分类
const jobCategories = {
  "技术": {
    "前端开发": ["前端工程师", "Web前端", "H5开发", "小程序开发", "React开发", "Vue开发"],
    "后端开发": ["Java开发", "Python开发", "Go开发", "PHP开发", "Node.js开发", ".NET开发"],
    "移动开发": ["iOS开发", "Android开发", "Flutter开发", "React Native开发"],
    "数据开发": ["数据工程师", "数据分析师", "大数据开发", "ETL工程师", "数仓工程师"],
    "运维/测试": ["测试工程师", "运维工程师", "DevOps", "SRE", "自动化测试"],
    "人工智能": ["算法工程师", "机器学习", "深度学习", "NLP工程师", "CV工程师"],
  },
  "产品": {
    "产品经理": ["产品经理", "高级产品经理", "产品总监", "B端产品", "C端产品", "数据产品"],
    "产品运营": ["产品运营", "用户运营", "增长产品", "商业化产品"],
    "产品设计": ["交互设计师", "用户研究员", "产品设计师"],
  },
  "设计": {
    "UI设计": ["UI设计师", "视觉设计师", "GUI设计师", "界面设计师"],
    "UX设计": ["UX设计师", "交互设计师", "用户体验设计师"],
    "品牌设计": ["品牌设计师", "平面设计师", "VI设计师"],
    "其他设计": ["动效设计师", "插画师", "3D设计师", "原画师"],
  },
  "运营": {
    "内容运营": ["内容运营", "新媒体运营", "文案策划", "编辑"],
    "用户运营": ["用户运营", "社群运营", "会员运营"],
    "活动运营": ["活动运营", "活动策划", "市场活动"],
    "数据运营": ["数据运营", "增长运营", "策略运营"],
  },
  "市场": {
    "市场营销": ["市场经理", "品牌经理", "营销策划"],
    "公关传播": ["公关经理", "媒介经理", "品牌传播"],
    "广告投放": ["广告优化师", "SEM", "信息流投放"],
  },
  "销售": {
    "销售代表": ["销售代表", "销售经理", "客户经理", "大客户销售"],
    "商务拓展": ["BD经理", "商务经理", "渠道经理"],
  },
  "人事": {
    "招聘": ["招聘专员", "招聘经理", "HRBP", "猎头"],
    "人力资源": ["人事专员", "薪酬绩效", "培训经理", "HR总监"],
  },
  "财务": {
    "会计": ["会计", "出纳", "成本会计", "税务会计"],
    "财务管理": ["财务经理", "财务总监", "财务分析师"],
  },
}

// Skill tags for job posting
const skillTags = {
  技术: ["React", "Vue", "TypeScript", "Node.js", "Python", "Java", "Go", "MySQL", "Redis", "Docker", "Kubernetes", "微服务"],
  产品: ["需求分析", "竞品分析", "用户研究", "数据分析", "项目管理", "Axure", "PRD文档"],
  设计: ["UI设计", "UX设计", "Figma", "Sketch", "交互设计", "视觉设计", "品牌设计"],
  运营: ["用户运营", "内容运营", "活动运营", "数据分析", "增长策略", "社群运营"],
}

export default function TalentSquarePage() {
  const [sortBy, setSortBy] = useState<"recommend" | "latest" | "active">("recommend")
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showRecommendDialog, setShowRecommendDialog] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState("")
  const [jobDesc, setJobDesc] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [currentSkillCategory, setCurrentSkillCategory] = useState<string>("技术")
  const [selectedJobForRecommend, setSelectedJobForRecommend] = useState<string | null>(null)
  
  // 状态：后端数据
  const [talents, setTalents] = useState<any[]>([])
  const [myJobs, setMyJobs] = useState<any[]>([])
  
  // 三级分类状态
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null)

  // 初始化加载
  useEffect(() => {
    fetchTalents()
    fetchMyJobs()
  }, [sortBy, selectedCategory])

  const fetchTalents = async () => {
    try {
      const response: any = await talentService.getTalents({
        sortBy: sortBy === "recommend" ? "matchScore" : (sortBy === "latest" ? "createdAt" : "lastActive"),
        sortOrder: "DESC",
        industry: selectedCategory || undefined
      })
      setTalents(response.data || [])
    } catch (error) {
      console.error("Failed to fetch talents:", error)
    }
  }

  const fetchMyJobs = async () => {
    try {
      const response: any = await jobService.getMyJobs()
      // 适配后端分页返回
      setMyJobs(response.data || response || [])
    } catch (error) {
      console.error("Failed to fetch my jobs:", error)
    }
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  // Auto-suggest skills based on job description
  const suggestSkillsFromDesc = () => {
    const keywords = ["前端", "后端", "React", "Vue", "Java", "Python", "产品", "设计", "运营"]
    const suggested: string[] = []
    keywords.forEach(kw => {
      if (jobDesc.includes(kw) || jobTitle.includes(kw)) {
        Object.values(skillTags).flat().forEach(skill => {
          if (skill.toLowerCase().includes(kw.toLowerCase()) && !suggested.includes(skill)) {
            suggested.push(skill)
          }
        })
      }
    })
    if (suggested.length > 0) {
      setSelectedSkills(prev => [...new Set([...prev, ...suggested.slice(0, 5)])])
    }
  }

  const handlePostJob = async () => {
    try {
      await jobService.createJob({
        title: jobTitle,
        description: jobDesc,
        status: "published"
      })
      setShowJobDialog(false)
      fetchMyJobs()
    } catch (error) {
      console.error("Failed to post job:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Hero Section - Compact */}
        <section className="mb-4">
          <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-primary/5 via-accent/50 to-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                发现优秀人才
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                50,000+ 优质候选人等待与您相遇
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {/* Smart Recommend - Select Job First */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="rounded-full" size="sm">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    智能推荐
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  align="end" 
                  className="w-80 p-0"
                  sideOffset={8}
                >
                  <div className="border-b border-border/40 p-3">
                    <span className="text-sm font-medium">选择职位获取推荐</span>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">根据职位要求智能匹配候选人</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {myJobs.map((job) => (
                      <button 
                        key={job.id}
                        onClick={() => setSelectedJobForRecommend(job.id)}
                        className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors ${
                          selectedJobForRecommend === job.id 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-accent"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-medium">{job.title}</p>
                          <p className="text-[10px] text-muted-foreground">{job.location || "远程"} · {job.salary || "面议"}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {selectedJobForRecommend === job.id && (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border/40 p-2">
                    <Button 
                      size="sm" 
                      className="w-full rounded-lg text-xs"
                      disabled={!selectedJobForRecommend}
                      onClick={() => setShowRecommendDialog(true)}
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      查看推荐人才
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                className="rounded-full" 
                size="sm"
                onClick={() => setShowJobDialog(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                发布职位
              </Button>
            </div>
          </div>
        </section>

        {/* Categories - Button style */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-foreground">热门领域</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-full px-4 text-xs"
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              >
                {category.name}
                <span className={`ml-1.5 text-[10px] ${selectedCategory === category.name ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {(category.count / 1000).toFixed(1)}k
                </span>
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-4 text-xs"
              onClick={() => setShowAllCategories(true)}
            >
              全部领域
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </section>

        {/* Filters + Sort in same row */}
        <section className="mb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <FilterBar />
            </div>
            {/* Sort - Right aligned */}
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              <button 
                className={`flex items-center gap-1 text-xs font-medium transition-colors ${sortBy === "recommend" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setSortBy("recommend")}
              >
                <Sparkles className="h-3 w-3" />
                推荐
              </button>
              <button 
                className={`flex items-center gap-1 text-xs font-medium transition-colors ${sortBy === "latest" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setSortBy("latest")}
              >
                <Clock className="h-3 w-3" />
                最新
              </button>
              <button 
                className={`flex items-center gap-1 text-xs font-medium transition-colors ${sortBy === "active" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setSortBy("active")}
              >
                <TrendingUp className="h-3 w-3" />
                活跃
              </button>
            </div>
          </div>
        </section>

        {/* Talent List - Compact Cards */}
        <section className="space-y-1.5">
          {talents.map((talent) => (
            <TalentCard key={talent.id} talent={talent} />
          ))}
          {talents.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">暂无人才数据</div>
          )}
        </section>

        {/* Load More */}
        {talents.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" className="rounded-full px-6 text-xs">
              加载更多
            </Button>
          </div>
        )}
      </main>

      {/* Post Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              发布新职位
            </DialogTitle>
            <DialogDescription className="text-xs">
              填写职位信息，快速吸引匹配的优质候选人
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="job-title" className="text-xs">职位名称</Label>
              <Input 
                id="job-title" 
                placeholder="例如：高级前端工程师" 
                className="h-10"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="job-desc" className="text-xs">职位描述</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 gap-1.5 rounded-full bg-primary/10 px-2.5 text-[10px] text-primary hover:bg-primary/20"
                  onClick={suggestSkillsFromDesc}
                >
                  <Wand2 className="h-3 w-3" />
                  AI 提取技能
                </Button>
              </div>
              <Textarea 
                id="job-desc" 
                placeholder="描述职位职责、要求、福利待遇等..."
                rows={4}
                className="text-sm"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowJobDialog(false)}>
              取消
            </Button>
            <Button onClick={handlePostJob}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              发布职位
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Categories Dialog */}
      <Dialog open={showAllCategories} onOpenChange={setShowAllCategories}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-border/40 px-6 py-4">
            <DialogTitle className="text-base">全部领域</DialogTitle>
            <DialogDescription className="text-xs">选择职位类别筛选人才</DialogDescription>
          </DialogHeader>
          <div className="flex h-96">
            <div className="w-28 shrink-0 overflow-y-auto border-r border-border/40 bg-accent/30">
              {Object.keys(jobCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setExpandedCategory(expandedCategory === cat ? null : cat)
                    setExpandedSubCategory(null)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-xs font-medium transition-colors ${
                    expandedCategory === cat 
                      ? "bg-background text-primary" 
                      : "text-foreground hover:bg-background/50"
                  }`}
                >
                  {cat}
                  <ChevronRight className={`h-3 w-3 transition-transform ${expandedCategory === cat ? "rotate-90" : ""}`} />
                </button>
              ))}
            </div>
            {expandedCategory && (
              <div className="w-36 shrink-0 overflow-y-auto border-r border-border/40">
                {Object.keys(jobCategories[expandedCategory as keyof typeof jobCategories]).map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setExpandedSubCategory(expandedSubCategory === subCat ? null : subCat)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                      expandedSubCategory === subCat 
                        ? "bg-primary/10 text-primary" 
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    {subCat}
                    <ChevronRight className={`h-3 w-3 transition-transform ${expandedSubCategory === subCat ? "rotate-90" : ""}`} />
                  </button>
                ))}
              </div>
            )}
            {expandedCategory && expandedSubCategory && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-wrap gap-2">
                  {jobCategories[expandedCategory as keyof typeof jobCategories][expandedSubCategory as keyof typeof jobCategories[keyof typeof jobCategories]]?.map((job: string) => (
                    <Button
                      key={job}
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full text-xs"
                      onClick={() => {
                        setSelectedCategory(job)
                        setShowAllCategories(false)
                      }}
                    >
                      {job}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recommend Dialog */}
      <Dialog open={showRecommendDialog} onOpenChange={setShowRecommendDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              智能推荐人才
            </DialogTitle>
            <DialogDescription className="text-xs">
              根据职位为您精选匹配人才
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-1.5 overflow-y-auto py-4">
            {talents.slice(0, 5).map((talent) => (
              <TalentCard key={talent.id} talent={talent} />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecommendDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
