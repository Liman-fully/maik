import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar, Filter, ChevronLeft } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const pointLogs = [
  { id: 1, type: "earn", amount: 500, reason: "完成企业认证", date: "2026-03-28", category: "任务奖励" },
  { id: 2, type: "spend", amount: 100, reason: "刷新职位: 高级前端工程师", date: "2026-03-27", category: "职位刷新" },
  { id: 3, type: "earn", amount: 50, reason: "每日登录奖励", date: "2026-03-27", category: "日常任务" },
  { id: 4, type: "spend", amount: 200, reason: "查看候选人联系方式", date: "2026-03-26", category: "简历查看" },
  { id: 5, type: "earn", amount: 1000, reason: "充值积分", date: "2026-03-25", category: "账户充值" },
]

export default function PointsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">我的积分</h1>
        </div>

        {/* Balance Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">当前可用积分</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">2,500</span>
                <span className="text-sm opacity-80">分</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <div className="mt-8 flex gap-3 relative z-10">
            <Button className="flex-1 bg-white text-primary hover:bg-white/90 rounded-xl font-bold">
              去充值
            </Button>
            <Button variant="outline" className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-xl">
              积分兑换
            </Button>
          </div>

          {/* Abstract decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
        </Card>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Card className="border-0 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-green-500/10">
                <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">累计获得</span>
            </div>
            <p className="text-lg font-bold text-foreground">+5,800</p>
          </Card>
          <Card className="border-0 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <ArrowDownLeft className="h-3.5 w-3.5 text-red-500" />
              </div>
              <span className="text-xs text-muted-foreground">累计消耗</span>
            </div>
            <p className="text-lg font-bold text-foreground">-3,300</p>
          </Card>
        </div>

        {/* List Header */}
        <div className="mt-8 flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">积分明细</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 rounded-lg">
              <Calendar className="h-3.5 w-3.5" />
              本月
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1.5 rounded-lg">
              <Filter className="h-3.5 w-3.5" />
              筛选
            </Button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {pointLogs.map((log) => (
            <Card key={log.id} className="border-0 p-4 flex items-center justify-between shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  log.type === "earn" ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  {log.type === "earn" ? (
                    <ArrowUpRight className={`h-5 w-5 ${log.type === "earn" ? "text-green-500" : "text-red-500"}`} />
                  ) : (
                    <ArrowDownLeft className={`h-5 w-5 ${log.type === "earn" ? "text-green-500" : "text-red-500"}`} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{log.reason}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{log.date}</span>
                    <Badge variant="outline" className="text-[8px] h-3.5 py-0 px-1 border-border/50 text-muted-foreground font-normal">
                      {log.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className={`text-sm font-bold tabular-nums ${
                log.type === "earn" ? "text-green-500" : "text-foreground"
              }`}>
                {log.type === "earn" ? "+" : "-"}{log.amount}
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <Button variant="ghost" className="mt-6 w-full text-xs text-muted-foreground hover:bg-accent/50 rounded-xl py-6">
          查看更多历史记录
        </Button>
      </main>
    </div>
  )
}
