"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  ChevronDown, 
  SlidersHorizontal,
  X,
  RotateCcw
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const filters = {
  location: {
    label: "工作地点",
    options: ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "西安", "苏州"],
  },
  experience: {
    label: "工作经验",
    options: ["应届生", "1年以内", "1-3年", "3-5年", "5-10年", "10年以上"],
  },
  education: {
    label: "学历要求",
    options: ["高中", "大专", "本科", "硕士", "博士", "MBA"],
  },
  salary: {
    label: "期望薪资",
    options: ["5K以下", "5-10K", "10-15K", "15-25K", "25-40K", "40-60K", "60K以上"],
  },
}

// 更多筛选 - 参考猎聘
const moreFilters = {
  industry: {
    label: "行业",
    options: ["互联网/IT", "金融", "教育培训", "医疗健康", "制造业", "房地产", "零售/消费", "物流/供应链", "咨询服务", "传媒/广告", "能源/环保", "政府/非营利"],
  },
  companyType: {
    label: "公司类型",
    options: ["上市公司", "外资企业", "国有企业", "民营企业", "合资企业", "创业公司", "事业单位"],
  },
  position: {
    label: "职位",
    options: ["技术", "产品", "设计", "运营", "市场", "销售", "人事", "财务", "行政", "法务"],
  },
  company: {
    label: "公司",
    options: ["字节跳动", "阿里巴巴", "腾讯", "美团", "京东", "百度", "滴滴", "快手", "小米", "华为"],
  },
  level: {
    label: "职级",
    options: ["实习生", "初级", "中级", "高级", "资深", "专家", "总监", "VP", "合伙人"],
  },
  jobStatus: {
    label: "求职状态",
    options: ["在职-考虑机会", "在职-暂不考虑", "离职-随时到岗", "应届生"],
  },
  gender: {
    label: "性别",
    options: ["不限", "男", "女"],
  },
  age: {
    label: "年龄范围",
    options: ["18-25岁", "25-30岁", "30-35岁", "35-40岁", "40-45岁", "45岁以上"],
  },
  language: {
    label: "语言能力",
    options: ["英语-精通", "英语-熟练", "日语", "韩语", "法语", "德语", "西班牙语", "俄语"],
  },
  certificate: {
    label: "证书资质",
    options: ["CPA", "CFA", "PMP", "司法考试", "一级建造师", "注册会计师", "律师资格"],
  },
  workType: {
    label: "工作性质",
    options: ["全职", "兼职", "实习", "远程"],
  },
}

interface FilterBarProps {
  onFilterChange?: (filters: Record<string, string[]>) => void
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [tempMoreFilters, setTempMoreFilters] = useState<Record<string, string[]>>({})

  const handleFilterSelect = (category: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[category] || []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      
      const newFilters = { ...prev, [category]: updated }
      if (updated.length === 0) delete newFilters[category]
      
      onFilterChange?.(newFilters)
      return newFilters
    })
  }

  const handleMoreFilterSelect = (category: string, value: string) => {
    setTempMoreFilters((prev) => {
      const current = prev[category] || []
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      
      const newFilters = { ...prev, [category]: updated }
      if (updated.length === 0) delete newFilters[category]
      return newFilters
    })
  }

  const applyMoreFilters = () => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev, ...tempMoreFilters }
      onFilterChange?.(newFilters)
      return newFilters
    })
    setShowMoreFilters(false)
  }

  const resetMoreFilters = () => {
    setTempMoreFilters({})
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    setTempMoreFilters({})
    onFilterChange?.({})
  }

  const openMoreFilters = () => {
    const currentMoreFilters: Record<string, string[]> = {}
    Object.keys(moreFilters).forEach((key) => {
      if (activeFilters[key]) {
        currentMoreFilters[key] = activeFilters[key]
      }
    })
    setTempMoreFilters(currentMoreFilters)
    setShowMoreFilters(true)
  }

  const activeCount = Object.values(activeFilters).flat().length
  const moreFilterCount = Object.keys(moreFilters).reduce((count, key) => {
    return count + (activeFilters[key]?.length || 0)
  }, 0)

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Dropdowns */}
          {Object.entries(filters).map(([key, filter]) => (
            <DropdownMenu key={key}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`h-8 rounded-full border-border/60 px-3 text-xs transition-all hover:border-primary/50 ${
                    activeFilters[key]?.length 
                      ? "border-primary bg-primary/5 text-primary" 
                      : ""
                  }`}
                >
                  {filter.label}
                  {activeFilters[key]?.length ? (
                    <Badge variant="secondary" className="ml-1.5 h-4 w-4 rounded-full bg-primary p-0 text-[10px] text-primary-foreground">
                      {activeFilters[key].length}
                    </Badge>
                  ) : (
                    <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                side="bottom"
                className="w-40"
                sideOffset={4}
              >
                {filter.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={activeFilters[key]?.includes(option)}
                    onCheckedChange={() => handleFilterSelect(key, option)}
                    className="text-xs"
                  >
                    {option}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {/* More Filters Button */}
          <Button 
            variant="outline" 
            size="sm"
            className={`h-8 rounded-full border-border/60 px-3 text-xs transition-all hover:border-primary/50 ${
              moreFilterCount > 0 ? "border-primary bg-primary/5 text-primary" : ""
            }`}
            onClick={openMoreFilters}
          >
            <SlidersHorizontal className="mr-1.5 h-3 w-3" />
            更多筛选
            {moreFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 w-4 rounded-full bg-primary p-0 text-[10px] text-primary-foreground">
                {moreFilterCount}
              </Badge>
            )}
          </Button>

          {/* Clear All */}
          {activeCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAllFilters}
              className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              清除全部
            </Button>
          )}
        </div>

        {/* Active Filter Tags */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(activeFilters).map(([category, values]) =>
              values.map((value) => (
                <Badge
                  key={`${category}-${value}`}
                  variant="secondary"
                  className="cursor-pointer gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary hover:bg-primary/20"
                  onClick={() => handleFilterSelect(category, value)}
                >
                  {value}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              ))
            )}
          </div>
        )}
      </div>

      {/* More Filters Dialog */}
      <Dialog open={showMoreFilters} onOpenChange={setShowMoreFilters}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4" />
              更多筛选条件
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {Object.entries(moreFilters).map(([key, filter]) => (
              <div key={key} className="space-y-2.5">
                <Label className="text-xs font-medium text-foreground">{filter.label}</Label>
                <div className="flex flex-wrap gap-2">
                  {filter.options.map((option) => {
                    const isSelected = tempMoreFilters[key]?.includes(option)
                    return (
                      <button
                        key={option}
                        onClick={() => handleMoreFilterSelect(key, option)}
                        className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button 
              variant="ghost" 
              onClick={resetMoreFilters}
              className="text-muted-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              重置
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowMoreFilters(false)}>
                取消
              </Button>
              <Button onClick={applyMoreFilters}>
                应用筛选
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
