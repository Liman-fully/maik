"use client"

import { useEffect, useState } from "react"
import TalentCard from "@/components/talent-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Sparkles } from "lucide-react"

// 模拟更多数据
const mockMoreTalents = [
  {
    id: "5",
    name: "陈明",
    title: "数据科学家",
    company: "阿里巴巴",
    currentCompany: "阿里巴巴",
    location: "杭州",
    education: "博士",
    school: "上海交通大学",
    experience: "8年",
    salary: "50-70k",
    expectedSalary: "60k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=陈明",
    workExperience: [
      { company: "微软亚洲研究院", title: "数据科学家", duration: "4年" },
      { company: "阿里巴巴", title: "高级数据科学家", duration: "4年" }
    ],
    skills: ["Python", "TensorFlow", "PyTorch", "SQL", "Hadoop"],
    tags: ["数据科学", "人工智能", "杭州", "阿里"]
  },
  {
    id: "6",
    name: "赵芳",
    title: "运营总监",
    company: "拼多多",
    currentCompany: "拼多多",
    location: "上海",
    education: "硕士",
    school: "复旦大学",
    experience: "7年",
    salary: "40-60k",
    expectedSalary: "50k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=赵芳",
    workExperience: [
      { company: "京东", title: "运营经理", duration: "3年" },
      { company: "拼多多", title: "运营总监", duration: "4年" }
    ],
    skills: ["用户运营", "数据分析", "产品运营", "团队管理"],
    tags: ["运营", "电商", "上海", "拼多多"]
  },
  {
    id: "7",
    name: "孙伟",
    title: "DevOps工程师",
    company: "字节跳动",
    currentCompany: "字节跳动",
    location: "北京",
    education: "本科",
    school: "北京邮电大学",
    experience: "4年",
    salary: "35-50k",
    expectedSalary: "42k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=孙伟",
    workExperience: [
      { company: "腾讯", title: "运维工程师", duration: "2年" },
      { company: "字节跳动", title: "DevOps工程师", duration: "2年" }
    ],
    skills: ["Kubernetes", "Docker", "AWS", "CI/CD", "监控"],
    tags: ["DevOps", "云计算", "北京", "字节"]
  },
  {
    id: "8",
    name: "周芳",
    title: "测试开发工程师",
    company: "美团",
    currentCompany: "美团",
    location: "北京",
    education: "硕士",
    school: "南京大学",
    experience: "5年",
    salary: "30-45k",
    expectedSalary: "38k",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=周芳",
    workExperience: [
      { company: "百度", title: "测试工程师", duration: "2年" },
      { company: "美团", title: "测试开发工程师", duration: "3年" }
    ],
    skills: ["自动化测试", "性能测试", "Python", "接口测试"],
    tags: ["测试开发", "质量保证", "北京", "美团"]
  }
]

interface PlazaFeedProps {
  talents: any[]
  loading?: boolean
  onLoadMore?: () => void
  className?: string
}

export default function PlazaFeed({ 
  talents, 
  loading = false,
  onLoadMore,
  className = ""
}: PlazaFeedProps) {
  const [displayedTalents, setDisplayedTalents] = useState(talents.slice(0, 4))
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()
  const itemsPerPage = 4

  // 模拟分页加载
  const loadMore = () => {
    if (loading || !hasMore) return
    
    const startIndex = page * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    // 这里实际会调用API
    const newTalents = mockMoreTalents.slice(0, itemsPerPage)
    
    if (newTalents.length > 0) {
      setTimeout(() => {
        setDisplayedTalents(prev => [...prev, ...newTalents])
        setPage(prev => prev + 1)
        
        // 模拟数据加载完
        if (page >= 2) {
          setHasMore(false)
        }
      }, 1500)
    } else {
      setHasMore(false)
    }
  }

  // 检测滚动到底部
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore()
    }
  }, [inView, hasMore, loading])

  // 重置数据
  useEffect(() => {
    setDisplayedTalents(talents.slice(0, itemsPerPage))
    setPage(1)
    setHasMore(true)
  }, [talents])

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  }

  return (
    <div className={className}>
      {/* 内容网格 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <AnimatePresence>
          {displayedTalents.map((talent, index) => (
            <motion.div
              key={talent.id}
              variants={itemVariants}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative group"
            >
              {/* 热门标签 */}
              {index < 2 && (
                <div className="absolute -top-2 -right-2 z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>热门</span>
                  </motion.div>
                </div>
              )}

              {/* 人才卡片 */}
              <TalentCard talent={talent} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* 加载状态 */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 加载更多指示器 */}
      {hasMore && displayedTalents.length > 0 && (
        <div ref={ref} className="mt-12 text-center py-8">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-flex flex-col items-center space-y-3"
          >
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-600 text-sm">加载更多精彩内容...</span>
          </motion.div>
        </div>
      )}

      {/* 没有更多内容 */}
      {!hasMore && displayedTalents.length > 0 && (
        <div className="mt-12 text-center py-8">
          <div className="inline-flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">已经到底了</h4>
              <p className="text-gray-600 text-sm">
                您已经浏览了所有相关内容
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {displayedTalents.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex flex-col items-center space-y-6">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="text-6xl mb-2"
            >
              🔍
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                未找到匹配的人才
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                尝试调整筛选条件或搜索其他关键词，或者刷新页面重试
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>试试不同的搜索词或筛选条件</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 统计数据 */}
      {displayedTalents.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <span className="text-gray-700 font-medium">{displayedTalents.length}</span>
              <span className="ml-1">个匹配项</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>前端开发</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>后端开发</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>数据科学</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}