"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import TalentCard from "@/components/talent-card"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { talentService } from "@/services/talent"
import { 
  FolderOpen, 
  Star, 
  Clock, 
  Eye,
  Download,
  Plus,
  Heart,
  Users,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const folders = [
  { id: "1", name: "前端工程师", count: 28, color: "bg-blue-500" },
  { id: "2", name: "产品经理", count: 15, color: "bg-green-500" },
  { id: "3", name: "UI设计师", count: 12, color: "bg-purple-500" },
  { id: "4", name: "后端开发", count: 23, color: "bg-orange-500" },
]

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState("collected")
  const [sortBy, setSortBy] = useState("收藏时间")
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchResumes = async () => {
    setLoading(true)
    try {
      // 简历库逻辑通常需要不同的接口，这里暂时复用 getTalents 模拟展示
      // 实际开发中应该调用如 talentService.getLibrary()
      const response: any = await talentService.getTalents({
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "DESC"
      })
      setResults(response.data || [])
      setTotal(response.pagination?.total || 0)
    } catch (error) {
      console.error("Failed to fetch resumes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [activeTab])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        {/* Page Header - Compact */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">简历库</h1>
            <p className="text-xs text-muted-foreground">管理收藏的候选人</p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 rounded text-xs">
              <Download className="mr-1 h-3 w-3" />
              导出
            </Button>
            <Button size="sm" className="h-7 rounded text-xs">
              <Plus className="mr-1 h-3 w-3" />
              新建文件夹
            </Button>
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="mb-3 grid grid-cols-4 gap-2">
          <Card className="border-0 p-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                <Heart className="h-3.5 w-3.5 text-red-500" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{total}</p>
                <p className="text-[10px] text-muted-foreground">已收藏</p>
              </div>
            </div>
          </Card>
          <Card className="border-0 p-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Eye className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">0</p>
                <p className="text-[10px] text-muted-foreground">已浏览</p>
              </div>
            </div>
          </Card>
          <Card className="border-0 p-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                <Users className="h-3.5 w-3.5 text-green-500" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">0</p>
                <p className="text-[10px] text-muted-foreground">已沟通</p>
              </div>
            </div>
          </Card>
          <Card className="border-0 p-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
                <FolderOpen className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{folders.length}</p>
                <p className="text-[10px] text-muted-foreground">文件夹</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Folders Row */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-[10px] font-medium text-muted-foreground">我的文件夹</h2>
            <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px] text-muted-foreground">
              全部 <ChevronRight className="ml-0.5 h-2.5 w-2.5" />
            </Button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                className="flex shrink-0 items-center gap-1.5 rounded bg-card px-2.5 py-1.5 shadow-sm transition-colors hover:bg-accent"
              >
                <div className={`h-2 w-2 rounded-full ${folder.color}`} />
                <span className="text-[11px] font-medium text-foreground">{folder.name}</span>
                <Badge variant="secondary" className="rounded bg-accent text-[9px] px-1 py-0">
                  {folder.count}
                </Badge>
              </button>
            ))}
            <button className="flex shrink-0 items-center gap-1 rounded bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground">
              <Plus className="h-3 w-3" />
              新建
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-3 h-auto w-full justify-start gap-0.5 rounded-lg bg-accent/50 p-0.5">
            <TabsTrigger 
              value="collected" 
              className="rounded text-[11px] data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Star className="mr-1 h-3 w-3" />
              已收藏
              <Badge variant="secondary" className="ml-1 h-4 rounded-full bg-primary/10 px-1 text-[9px] text-primary">
                {total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="viewed" 
              className="rounded text-[11px] data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Eye className="mr-1 h-3 w-3" />
              浏览记录
              <Badge variant="secondary" className="ml-1 h-4 rounded-full bg-accent px-1 text-[9px]">
                0
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="contacted" 
              className="rounded text-[11px] data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Clock className="mr-1 h-3 w-3" />
              已沟通
              <Badge variant="secondary" className="ml-1 h-4 rounded-full bg-accent px-1 text-[9px]">
                0
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Filters + Sort */}
          <div className="mb-3">
            <FilterBar />
          </div>

          {/* Sort - Right aligned */}
          <div className="mb-2 flex items-center justify-end border-b border-border/40 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 gap-0.5 px-1.5 text-[10px] text-muted-foreground">
                  {sortBy}
                  <ChevronDown className="h-2.5 w-2.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                {["收藏时间", "最近活跃", "匹配度", "薪资范围"].map((option) => (
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

          <TabsContent value={activeTab} className="mt-0">
            {results.length > 0 ? (
              <div className="space-y-1.5">
                {results.map((talent) => (
                  <TalentCard key={talent.id} talent={talent} variant="library" />
                ))}
              </div>
            ) : (
              <Card className="border-0 py-10 text-center shadow-sm">
                <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-medium text-foreground">暂无数据</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  浏览脉刻 MAIK，收藏感兴趣的候选人
                </p>
                <Button size="sm" className="mt-3 rounded-full text-xs">
                  去脉刻 MAIK
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Load More */}
        {results.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" className="rounded-full px-6 text-xs">
              加载更多
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
