"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import TalentCard from "@/components/talent-card"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { talentService } from "@/services/talent"
import { 
  Search, 
  Sparkles, 
  History,
  TrendingUp,
  X,
  ChevronDown,
  Briefcase,
  Check
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const hotSearches = [
  "前端工程师",
  "产品经理",
  "Java开发",
  "UI设计师",
  "数据分析师",
  "运营经理",
]

const recentSearches = [
  "React高级工程师 北京",
  "3年以上产品经理",
  "Python数据开发",
]

// 已发布的职位 - 用于快捷筛选
const myJobs = [
  { id: "1", title: "高级前端工程师", location: "北京", salary: "35-50K", skills: ["React", "TypeScript"] },
  { id: "2", title: "产品经理", location: "上海", salary: "30-45K", skills: ["需求分析", "数据分析"] },
  { id: "3", title: "Java开发工程师", location: "深圳", salary: "25-40K", skills: ["Java", "Spring Boot"] },
]

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [sortBy, setSortBy] = useState("匹配度优先")
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  const fetchTalents = async (query?: string) => {
    const searchTerm = query || searchQuery
    setIsSearching(true)
    try {
      const response: any = await talentService.getTalents({
        skills: searchTerm,
        sortBy: sortBy === "匹配度优先" ? "matchScore" : "createdAt",
        sortOrder: "DESC",
        page: 1,
        pageSize: 10
      })
      setResults(response.data || [])
      setTotal(response.pagination?.total || 0)
      setHasSearched(true)
    } catch (error) {
      console.error("Failed to fetch talents:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery
    if (!searchTerm.trim()) return
    setSearchQuery(searchTerm)
    fetchTalents(searchTerm)
  }

  const handleJobFilter = (jobId: string) => {
    const job = myJobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJob(jobId)
      setSearchQuery(job.title)
      fetchTalents(job.title)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setHasSearched(false)
    setSelectedJob(null)
    setResults([])
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        {/* Search Header - Compact */}
        <div className="mb-4 text-center">
          <h1 className="text-lg font-bold text-foreground">搜索简历</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">输入职位、技能或关键词</p>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜索职位、技能、公司..."
              className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-28 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <Button 
                onClick={() => handleSearch()}
                className="h-8 rounded-lg px-4 text-xs"
                size="sm"
                disabled={isSearching}
              >
                {isSearching ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    搜索中
                  </span>
                ) : (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    搜索
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Job Tags - Quick filter by posted jobs */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
            <Briefcase className="h-3 w-3" />
            按已发布职位筛选
          </div>
          <div className="flex flex-wrap gap-2">
            {myJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleJobFilter(job.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                  selectedJob === job.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card shadow-sm hover:bg-accent"
                }`}
              >
                {selectedJob === job.id && <Check className="h-3 w-3" />}
                {job.title}
                <span className={`text-[10px] ${selectedJob === job.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {job.location}
                </span>
              </button>
            ))}
          </div>
        </div>

        {!hasSearched ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section className="mb-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <h2 className="text-xs font-medium text-muted-foreground">搜索历史</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSearch(search)}
                      className="group flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-foreground shadow-sm transition-all hover:bg-accent"
                    >
                      {search}
                      <X className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Hot Searches */}
            <section className="mb-4">
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-xs font-medium text-muted-foreground">热门搜索</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {hotSearches.map((search, index) => (
                  <button
                    key={search}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-foreground shadow-sm transition-all hover:bg-accent"
                  >
                    {index < 3 && (
                      <Badge variant="secondary" className="h-4 w-4 rounded-full bg-primary/10 p-0 text-[9px] font-bold text-primary">
                        {index + 1}
                      </Badge>
                    )}
                    {search}
                  </button>
                ))}
              </div>
            </section>

            {/* Search Tips */}
            <Card className="border-0 bg-accent/50 p-4 shadow-sm">
              <h3 className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                搜索技巧
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>使用「职位 + 城市」组合，如「前端 北京」</li>
                <li>添加经验筛选，如「3年 Java」</li>
                <li>支持技能标签，如「React TypeScript」</li>
                <li>点击上方职位标签快速按职位要求筛选</li>
              </ul>
            </Card>
          </>
        ) : (
          <>
            {/* Filters + Sort in same row */}
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex-1">
                <FilterBar />
              </div>
              {/* Sort - Right aligned */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0 h-8 gap-1.5 px-3 text-xs text-muted-foreground">
                    {sortBy}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-32">
                  {["匹配度优先", "最新活跃", "经验最多", "薪资最高"].map((option) => (
                    <DropdownMenuItem 
                      key={option} 
                      onClick={() => setSortBy(option)}
                      className="text-xs"
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Results Header */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                找到 <span className="font-semibold text-foreground">{total}</span> 位匹配候选人
              </p>
              {selectedJob && (
                <Badge variant="secondary" className="gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {myJobs.find(j => j.id === selectedJob)?.title}
                  <button onClick={() => setSelectedJob(null)}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Search Results - Compact List */}
            <div className="space-y-1.5">
              {results.map((talent) => (
                <TalentCard key={talent.id} talent={talent} />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" className="rounded-full px-6 text-xs">
                加载更多
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
