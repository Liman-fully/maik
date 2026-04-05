"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Star,
  MessageCircle,
  Heart,
  Building2,
  Plus,
  FileText,
  UserPlus,
  Mail,
  Phone,
  LinkIcon,
  X
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WorkExperience {
  company: string
  title: string
  duration: string
}

interface TalentCardProps {
  talent: {
    id: string
    name: string
    avatar?: string
    title: string
    currentTitle?: string // 后端字段
    company: string
    currentCompany?: string // 后端字段
    location: string
    education: string
    school?: string
    experience: string
    salary: string
    expectedSalary?: string // 后端字段
    skills: string[] | string
    isOnline?: boolean
    isStarred?: boolean
    workHistory?: WorkExperience[]
    status?: string // 人才流程状态
    score?: number // 人才评估分
    industry?: string // 行业标签
    function?: string // 职能标签
  }
  className?: string
  variant?: "default" | "library" // default=脉刻 MAIK, library=简历库
  onChat?: () => void
  onFavorite?: () => void
  onAddToJob?: () => void
  onRequestResume?: () => void
}

export default function TalentCard({ 
  talent: rawTalent, 
  className, 
  variant = "default",
  onChat, 
  onFavorite,
  onAddToJob,
  onRequestResume
}: TalentCardProps) {
  // 基础数据补全
  const talent = {
    ...rawTalent,
    title: rawTalent.title || rawTalent.currentTitle || "未知职位",
    company: rawTalent.company || rawTalent.currentCompany || "未知公司",
    salary: rawTalent.salary || rawTalent.expectedSalary || "面议",
    skills: Array.isArray(rawTalent.skills) 
      ? rawTalent.skills 
      : (typeof rawTalent.skills === 'string' ? rawTalent.skills.split(',') : []),
    score: rawTalent.score || 0,
    industry: rawTalent.industry || "通用",
    function: rawTalent.function || "技术"
  }

  const [isStarred, setIsStarred] = useState(talent.isStarred || false)
  const [showProfile, setShowProfile] = useState(false)

  // 环形评分组件
  const ScoreRing = ({ score }: { score: number }) => {
    const radius = 16
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    
    let color = "stroke-primary"
    if (score >= 85) color = "stroke-[oklch(0.65_0.2_145)]" // 卓越
    else if (score >= 70) color = "stroke-blue-500" // 优秀
    else if (score < 50) color = "stroke-orange-500" // 一般

    return (
      <div className="relative flex h-10 w-10 items-center justify-center">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-accent"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-500", color || "text-primary")}
          />
        </svg>
        <span className="absolute text-[10px] font-bold">{score}</span>
      </div>
    )
  }

  // Mock work history if not provided
  const workHistory = talent.workHistory || [
    { company: talent.company, title: talent.title, duration: "2022-至今" },
    { company: "上一家公司", title: "初级" + talent.title.replace(/高级|资深|首席/g, ""), duration: "2020-2022" },
  ]

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsStarred(!isStarred)
    onFavorite?.()
  }

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowProfile(true)
  }

  return (
    <>
      <div className={cn(
        "group flex cursor-pointer items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2 shadow-sm transition-all duration-200 hover:bg-slate-100 hover:shadow",
        className
      )}>
        {/* Avatar - Click to open profile */}
        <div 
          className="relative shrink-0 cursor-pointer"
          onClick={handleNameClick}
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 transition-transform hover:scale-105">
            {talent.avatar ? (
              <img src={talent.avatar} alt={talent.name} className="h-full w-full rounded-lg object-cover" />
            ) : null}
          </div>
          {talent.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[oklch(0.55_0.15_145)]" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Row 1: Name, Star, Title, Salary */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span 
                className="shrink-0 cursor-pointer text-sm font-semibold text-foreground hover:text-primary"
                onClick={handleNameClick}
              >
                {talent.name}
              </span>
              {isStarred && (
                <Star className="h-3 w-3 shrink-0 fill-[oklch(0.7_0.15_80)] text-[oklch(0.7_0.15_80)]" />
              )}
              <span className="truncate text-xs text-muted-foreground">· {talent.industry} | {talent.function}</span>
              <Badge variant="outline" className="h-4 border-primary/20 bg-primary/5 px-1 text-[8px] font-normal text-primary">
                智能打标
              </Badge>
            </div>
            {talent.score > 0 ? (
              <div className="flex items-center gap-2">
                <ScoreRing score={talent.score} />
                <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  {talent.salary}
                </span>
              </div>
            ) : (
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                {talent.salary}
              </span>
            )}
          </div>

          {/* Row 2: Company, Location, Experience, Education */}
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Briefcase className="h-3 w-3" />
              {talent.company}
            </span>
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {talent.location}
            </span>
            <span>{talent.experience}</span>
            <span className="flex items-center gap-0.5">
              <GraduationCap className="h-3 w-3" />
              {talent.education}
              {talent.school && <span className="hidden sm:inline">· {talent.school}</span>}
            </span>
          </div>

          {/* Row 3: Work History */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
            {workHistory.slice(0, 2).map((work, idx) => (
              <span key={idx} className="flex items-center gap-0.5 text-muted-foreground">
                <Building2 className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{work.company}</span>
                <span className="text-muted-foreground/60">({work.duration})</span>
              </span>
            ))}
          </div>

          {/* Row 4: Skills + Actions */}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              {talent.skills.slice(0, 4).map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary"
                  className="rounded bg-accent px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                >
                  {skill}
                </Badge>
              ))}
              {talent.skills.length > 4 && (
                <Badge 
                  variant="secondary"
                  className="rounded bg-accent px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                >
                  +{talent.skills.length - 4}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {/* Favorite Button */}
              <Button 
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 rounded",
                  isStarred ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"
                )}
                onClick={handleFavorite}
              >
                <Heart className={cn("h-3 w-3", isStarred && "fill-current")} />
              </Button>

              {variant === "library" ? (
                // 简历库模式的按钮
                <>
                  {talent.status && (
                    <Badge variant="outline" className="h-6 rounded border-primary/30 px-1.5 text-[10px] text-primary">
                      {talent.status}
                    </Badge>
                  )}
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-6 rounded px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToJob?.()
                    }}
                  >
                    <LinkIcon className="mr-0.5 h-2.5 w-2.5" />
                    关联职位
                  </Button>
                  <Button 
                    size="sm"
                    className="h-6 rounded px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChat?.()
                    }}
                  >
                    <MessageCircle className="mr-0.5 h-3 w-3" />
                    沟通
                  </Button>
                </>
              ) : (
                // 脉刻 MAIK模式的按钮
                <>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-6 rounded px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToJob?.()
                    }}
                  >
                    <Plus className="mr-0.5 h-2.5 w-2.5" />
                    加入职位
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-6 rounded px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRequestResume?.()
                    }}
                  >
                    <FileText className="mr-0.5 h-2.5 w-2.5" />
                    求简历
                  </Button>
                  <Button 
                    size="sm"
                    className="h-6 rounded px-2 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChat?.()
                    }}
                  >
                    <MessageCircle className="mr-0.5 h-3 w-3" />
                    沟通
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-12">
            <button 
              onClick={() => setShowProfile(false)}
              className="absolute right-3 top-3 rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Avatar */}
          <div className="relative -mt-10 flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-lg ring-4 ring-background">
                {talent.avatar ? (
                  <img src={talent.avatar} alt={talent.name} className="h-full w-full rounded-2xl object-cover" />
                ) : null}
              </div>
              {talent.isOnline && (
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-3 border-background bg-[oklch(0.55_0.15_145)]" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="px-6 pb-6 pt-3 text-center">
            <h3 className="text-lg font-bold text-foreground">{talent.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{talent.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{talent.company} · {talent.location}</p>

            {/* Quick info */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {talent.experience}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {talent.education}
              </span>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {talent.salary}
              </span>
            </div>

            {/* Skills */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {talent.skills.slice(0, 5).map((skill) => (
                <Badge 
                  key={skill}
                  variant="secondary"
                  className="rounded-full bg-accent px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {skill}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-lg"
                onClick={() => setShowProfile(false)}
              >
                <UserPlus className="mr-1.5 h-4 w-4" />
                加好友
              </Button>
              <Button 
                className="flex-1 rounded-lg"
                onClick={() => {
                  setShowProfile(false)
                  onChat?.()
                }}
              >
                <MessageCircle className="mr-1.5 h-4 w-4" />
                开始沟通
              </Button>
            </div>

            {/* Contact info hints */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                查看邮箱
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                查看电话
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
