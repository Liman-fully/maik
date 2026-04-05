"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, TrendingUp, Users, Briefcase } from "lucide-react"
import TalentCard from "@/components/talent-card"
import PlazaFilter from "./components/plaza-filter"
import PlazaFeed from "./components/plaza-feed"

// 模拟数据 - 后期会从API获取
const mockTalents = [
  {
    id: "1",
    name: "张明",
    title: "高级前端工程师",
    company: "腾讯科技",
    currentCompany: "腾讯科技",
    location: "深圳",
    education: "硕士",
    school: "清华大学",
    experience: "5年",
    salary: "30-40k",
    expectedSalary: "35k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=张明",
    workExperience: [
      { company: "阿里巴巴", title: "前端开发工程师", duration: "2年" },
      { company: "腾讯", title: "高级前端工程师", duration: "3年" }
    ],
    skills: ["React", "TypeScript", "Node.js", "Vue.js"],
    tags: ["前端", "TypeScript", "React", "深圳"]
  },
  {
    id: "2",
    name: "李华",
    title: "产品经理",
    company: "字节跳动",
    currentCompany: "字节跳动",
    location: "北京",
    education: "硕士",
    school: "北京大学",
    experience: "4年",
    salary: "40-50k",
    expectedSalary: "45k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=李华",
    workExperience: [
      { company: "百度", title: "产品助理", duration: "2年" },
      { company: "字节跳动", title: "产品经理", duration: "2年" }
    ],
    skills: ["产品策划", "数据分析", "用户研究", "项目管理"],
    tags: ["产品经理", "北京", "字节跳动", "TikTok"]
  },
  {
    id: "3",
    name: "王芳",
    title: "UI设计师",
    company: "美团",
    currentCompany: "美团",
    location: "上海",
    education: "本科",
    school: "中国美术学院",
    experience: "3年",
    salary: "25-35k",
    expectedSalary: "30k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=王芳",
    workExperience: [
      { company: "滴滴出行", title: "UI设计师", duration: "2年" },
      { company: "美团", title: "高级UI设计师", duration: "1年" }
    ],
    skills: ["Figma", "Sketch", "Photoshop", "动效设计"],
    tags: ["UI设计", "上海", "美团", "视觉设计"]
  },
  {
    id: "4",
    name: "刘伟",
    title: "后端开发工程师",
    company: "华为",
    currentCompany: "华为",
    location: "杭州",
    education: "博士",
    school: "浙江大学",
    experience: "6年",
    salary: "35-45k",
    expectedSalary: "40k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=刘伟",
    workExperience: [
      { company: "网易", title: "Java开发工程师", duration: "3年" },
      { company: "华为", title: "后端开发工程师", duration: "3年" }
    ],
    skills: ["Java", "Spring Cloud", "微服务", "MySQL"],
    tags: ["后端开发", "Java", "杭州", "华为"]
  }
]

// 热门标签
const popularTags = [
  "前端开发", "后端开发", "产品经理", "UI设计", 
  "数据科学", "人工智能", "运营", "市场营销",
  "深圳", "北京", "上海", "杭州", "远程",
  "30k+", "50k+", "大厂", "创业公司"
]

export default function PlazaPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [salaryRange, setSalaryRange] = useState([0, 100])
  const [activeTab, setActiveTab] = useState("talents")
  const [filteredTalents, setFilteredTalents] = useState(mockTalents)
  const [loadingMore, setLoadingMore] = useState(false)

  // 筛选功能
  useEffect(() => {
    let filtered = mockTalents

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(talent => 
        talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talent.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(talent => 
        selectedTags.some(tag => talent.tags.includes(tag))
      )
    }

    // 薪资筛选
    filtered = filtered.filter(talent => {
      const salaryNum = parseInt(talent.expectedSalary?.replace('k', '') || talent.salary.split('-')[0])
      return salaryNum >= salaryRange[0] && salaryNum <= salaryRange[1]
    })

    setFilteredTalents(filtered)
  }, [searchQuery, selectedTags, salaryRange])

  // 模拟加载更多数据
  const handleLoadMore = () => {
    setLoadingMore(true)
    setTimeout(() => {
      setLoadingMore(false)
      console.log("加载更多数据...")
    }, 1500)
  }

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 头部区域 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              脉刻广场
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              连接顶尖人才与机会的职场社交平台
            </p>
            
            {/* 搜索框 */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜索人才、职位或技能..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg rounded-full border-gray-300 shadow-lg"
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6"
                  size="lg"
                >
                  搜索
                </Button>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Users className="text-blue-500" />
                  <span className="text-2xl font-bold">10,234</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">活跃人才</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Briefcase className="text-green-500" />
                  <span className="text-2xl font-bold">5,678</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">招聘职位</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="text-orange-500" />
                  <span className="text-2xl font-bold">89%</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">匹配成功率</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Users className="text-purple-500" />
                  <span className="text-2xl font-bold">1,234</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">伯乐推荐</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧筛选栏 */}
          <div className="lg:w-1/4">
            <PlazaFilter
              selectedTags={selectedTags}
              onTagClick={handleTagClick}
              salaryRange={salaryRange}
              onSalaryChange={setSalaryRange}
              popularTags={popularTags}
            />
          </div>

          {/* 右侧内容区域 */}
          <div className="lg:w-3/4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="talents">
                  人才广场
                </TabsTrigger>
                <TabsTrigger value="jobs">
                  招聘职位
                </TabsTrigger>
                <TabsTrigger value="shares">
                  职场分享
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="talents">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    发现顶尖人才 {filteredTalents.length > 0 && `(${filteredTalents.length})`}
                  </h2>
                  <p className="text-gray-600">
                    基于您的筛选条件，为您推荐最匹配的人才
                  </p>
                </div>

                {/* 热门标签 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">热门标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 人才卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {filteredTalents.map((talent) => (
                    <div key={talent.id}>
                      <TalentCard talent={talent} />
                    </div>
                  ))}
                </div>

                {/* 加载更多按钮 */}
                <div className="mt-12 text-center py-8">
                  <Button 
                    onClick={handleLoadMore} 
                    disabled={loadingMore}
                    variant="outline"
                    className="px-8"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                        加载中...
                      </>
                    ) : (
                      "加载更多"
                    )}
                  </Button>
                </div>

                {filteredTalents.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">未找到匹配的人才</h3>
                    <p className="text-gray-600">尝试调整筛选条件或搜索其他关键词</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="jobs">
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🚧</div>
                  <h3 className="text-xl font-semibold mb-2">招聘职位功能开发中</h3>
                  <p className="text-gray-600">我们将很快为您提供更多优质的招聘机会</p>
                </div>
              </TabsContent>

              <TabsContent value="shares">
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold mb-2">职场分享功能开发中</h3>
                  <p className="text-gray-600">分享职场经验，连接更多同行</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div className="bg-white border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="mb-2">脉刻广场 - 连接一切职场可能</p>
          <p className="text-sm">© 2026 脉刻(maik). All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}