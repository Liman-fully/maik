"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { userService, UserProfile } from "@/services/user"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  Edit,
  Shield,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Crown,
  Zap,
  Eye,
  MessageCircle,
  Heart,
  Settings,
  FileText,
  Award,
  Check,
  Sparkles,
  Search,
  Download,
  Wallet
} from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [vipPopoverOpen, setVipPopoverOpen] = useState(false)

  useEffect(() => {
    userService.getMe().then(data => {
      setProfile(data)
      setLoading(false)
    }).catch(err => {
      console.error("Failed to load profile", err)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground animate-pulse">正在加载个人资料...</p>
    </div>
  )

  if (!profile) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">请先登录以查看个人资料</p>
        <Button onClick={() => window.location.href = "/login"}>前往登录</Button>
      </div>
    </div>
  )

  const menuItems = [
    { icon: Wallet, label: "我的积分", href: "/profile/points", badge: profile.points?.toLocaleString() || "0", badgeType: "primary" },
    { icon: User, label: "个人资料", href: "/profile/edit", badge: null },
    { icon: Building2, label: "企业认证", href: "/profile/company", badge: profile.company ? "已认证" : "未认证", badgeType: profile.company ? "primary" : "warning" },
    { icon: Shield, label: "账号安全", href: "/profile/security", badge: null },
    { icon: CreditCard, label: "会员服务", href: "/profile/membership", badge: profile.membership?.level?.toUpperCase() || "免费版", badgeType: profile.membership ? "primary" : "default" },
    { icon: FileText, label: "发布的职位", href: "/profile/jobs", badge: "3", badgeType: "default" },
    { icon: Award, label: "招聘数据", href: "/profile/analytics", badge: null },
    { icon: Bell, label: "消息通知", href: "/profile/notifications", badge: null },
    { icon: Settings, label: "偏好设置", href: "/profile/preferences", badge: null },
    { icon: HelpCircle, label: "帮助与反馈", href: "/profile/help", badge: null },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Profile Header Card - Avatar Embedded */}
        <Card className="relative border-0 overflow-hidden shadow-sm">
          {/* Background Gradient */}
          <div className="h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent" />
          
          {/* Content */}
          <div className="px-4 pb-4 sm:px-5">
            {/* Avatar Overlay */}
            <div className="flex items-end gap-3 -mt-8">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-card shadow-sm" />
                <button className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1 text-primary-foreground shadow-md">
                  <Edit className="h-3 w-3" />
                </button>
              </div>
              
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-lg font-bold text-foreground">
                    {profile.name}
                  </h1>
                  {/* VIP Badge with Popover */}
                  <Popover open={vipPopoverOpen} onOpenChange={setVipPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1 rounded-full bg-[oklch(0.7_0.15_80)]/15 px-2 py-0.5 text-[10px] font-medium text-[oklch(0.5_0.12_80)] transition-colors hover:bg-[oklch(0.7_0.15_80)]/25">
                        <Crown className="h-3 w-3" />
                        {profile.membership?.level?.toUpperCase() || "普通用户"}
                        {profile.membership && (
                          <>
                            <span className="text-[oklch(0.5_0.12_80)]/60">·</span>
                            <span className="text-[oklch(0.5_0.12_80)]/80">{new Date(profile.membership.expiresAt).toLocaleDateString()}到期</span>
                          </>
                        )}
                      </button>
                    </PopoverTrigger>

                    <PopoverContent className="w-72 p-0" align="start">
                      <div className="bg-gradient-to-r from-[oklch(0.25_0.05_250)] to-[oklch(0.3_0.08_280)] p-3 text-white rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-[oklch(0.8_0.15_80)]" />
                          <span className="text-sm font-semibold">VIP会员权益</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70">尊享5项专属特权</p>
                      </div>
                      <div className="p-3 space-y-2">
                        {vipBenefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-2.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <benefit.icon className="h-3 w-3 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">{benefit.label}</p>
                              <p className="text-[10px] text-muted-foreground">{benefit.desc}</p>
                            </div>
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                          </div>
                        ))}
                      </div>
                      <div className="border-t p-3">
                        <Button size="sm" className="w-full rounded-full">
                          <Zap className="mr-1.5 h-3.5 w-3.5" />
                          续费会员
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {profile.company || "未填写公司"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    北京
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                hr@talenthub.com
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </span>
            </div>

            {/* Profile Completion */}
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">资料完善度</span>
                  <span className="font-medium text-primary">75%</span>
                </div>
                <Progress value={75} className="mt-1.5 h-1.5" />
              </div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs text-primary">
                完善
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 p-3 text-center shadow-sm">
              <stat.icon className={`mx-auto h-4 w-4 ${stat.color}`} />
              <p className="mt-1.5 text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Membership Usage Card */}
        <Card className="mt-3 border-0 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.7_0.15_80)] to-[oklch(0.6_0.15_60)]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">本月刷新次数</p>
                <p className="text-xs text-muted-foreground">VIP会员每月30次</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">28<span className="text-sm font-normal text-muted-foreground">/30</span></p>
            </div>
          </div>
        </Card>

        {/* Menu List - Compact */}
        <Card className="mt-3 border-0 overflow-hidden shadow-sm">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className={`flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-accent ${
                index !== menuItems.length - 1 ? "border-b border-border/30" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
                  <item.icon className="h-4 w-4 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={`rounded-full text-[10px] ${
                      item.badgeType === "primary" 
                        ? "bg-primary/10 text-primary" 
                        : item.badgeType === "warning"
                        ? "bg-[oklch(0.7_0.15_80)]/10 text-[oklch(0.5_0.15_80)]"
                        : "bg-accent"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </Card>

        {/* Quick Settings */}
        <Card className="mt-3 border-0 shadow-sm">
          <div className="px-4 py-2.5">
            <h2 className="text-xs font-medium text-muted-foreground">快捷设置</h2>
          </div>
          <div className="px-4 pb-3 space-y-1">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
                  <Bell className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">消息推送</p>
                  <p className="text-[10px] text-muted-foreground">接收新消息通知</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
                  <Eye className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">简历可见</p>
                  <p className="text-[10px] text-muted-foreground">允许候选人查看</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Logout */}
        <Button 
          variant="ghost" 
          className="mt-4 w-full rounded-xl text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </Button>

        {/* Version */}
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          TalentHub v1.0.0
        </p>
      </main>
    </div>
  )
}
