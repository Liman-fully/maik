"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Filter, MapPin, DollarSign, Briefcase, Calendar } from "lucide-react"

interface PlazaFilterProps {
  selectedTags: string[]
  onTagClick: (tag: string) => void
  salaryRange: number[]
  onSalaryChange: (range: number[]) => void
  popularTags: string[]
}

// 更多筛选选项
const locations = ["北京", "上海", "深圳", "杭州", "广州", "成都", "远程"]
const jobTypes = ["全职", "兼职", "实习", "远程", "外包"]
const experienceLevels = ["应届生", "1-3年", "3-5年", "5-10年", "10年以上"]
const educationLevels = ["大专", "本科", "硕士", "博士"]

export default function PlazaFilter({
  selectedTags,
  onTagClick,
  salaryRange,
  onSalaryChange,
  popularTags
}: PlazaFilterProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])
  const [selectedExperience, setSelectedExperience] = useState<string[]>([])
  const [selectedEducation, setSelectedEducation] = useState<string[]>([])

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    )
  }

  const handleJobTypeToggle = (type: string) => {
    setSelectedJobTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleExperienceToggle = (level: string) => {
    setSelectedExperience(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const handleEducationToggle = (level: string) => {
    setSelectedEducation(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const handleReset = () => {
    setSelectedLocations([])
    setSelectedJobTypes([])
    setSelectedExperience([])
    setSelectedEducation([])
    onSalaryChange([0, 100])
    // 清空所有标签选择
    selectedTags.forEach(tag => onTagClick(tag))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>筛选条件</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 薪资范围 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <h3 className="font-medium">期望薪资 (k)</h3>
              </div>
              <span className="text-sm text-gray-500">
                {salaryRange[0]}k - {salaryRange[1]}k
              </span>
            </div>
            <Slider
              value={salaryRange}
              onValueChange={onSalaryChange}
              min={0}
              max={100}
              step={5}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>0k</span>
              <span>100k+</span>
            </div>
          </div>

          <Separator />

          {/* 工作地点 */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium">工作地点</h3>
            </div>
            <div className="space-y-2">
              {locations.map(location => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`location-${location}`}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => handleLocationToggle(location)}
                  />
                  <label 
                    htmlFor={`location-${location}`}
                    className="text-sm cursor-pointer"
                  >
                    {location}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 工作类型 */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium">工作类型</h3>
            </div>
            <div className="space-y-2">
              {jobTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`job-type-${type}`}
                    checked={selectedJobTypes.includes(type)}
                    onCheckedChange={() => handleJobTypeToggle(type)}
                  />
                  <label 
                    htmlFor={`job-type-${type}`}
                    className="text-sm cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 工作经验 */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4 text-orange-600" />
              <h3 className="font-medium">工作经验</h3>
            </div>
            <div className="space-y-2">
              {experienceLevels.map(level => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`exp-${level}`}
                    checked={selectedExperience.includes(level)}
                    onCheckedChange={() => handleExperienceToggle(level)}
                  />
                  <label 
                    htmlFor={`exp-${level}`}
                    className="text-sm cursor-pointer"
                  >
                    {level}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 学历要求 */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="font-medium">学历要求</h3>
            </div>
            <div className="space-y-2">
              {educationLevels.map(level => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edu-${level}`}
                    checked={selectedEducation.includes(level)}
                    onCheckedChange={() => handleEducationToggle(level)}
                  />
                  <label 
                    htmlFor={`edu-${level}`}
                    className="text-sm cursor-pointer"
                  >
                    {level}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 热门标签 */}
          <div>
            <h3 className="font-medium mb-3">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 8).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-xs"
                  onClick={() => onTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 重置按钮 */}
          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleReset}
            >
              重置所有筛选条件
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 高级筛选提示 */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">高级筛选</h4>
            <p className="text-sm text-gray-600 mb-3">
              使用高级筛选功能，精准匹配您需要的人才
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-600 hover:text-blue-700"
            >
              了解更多 →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}