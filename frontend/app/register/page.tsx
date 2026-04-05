"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Briefcase, Lock, Mail, Phone, User, Eye, EyeOff, ShieldCheck, Sparkles, UserCircle, Building2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"

// API 基础路径
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

// 认证服务接口
interface AuthResponse {
  token: string
  userInfo: any
}

class AuthService {
  async register(
    email: string,
    phone: string,
    password: string,
    confirmPassword: string,
    name: string,
    role: "seeker" | "employer"
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/register/account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, phone, password, confirmPassword, name, role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "注册失败")
    }

    return response.json()
  }
}

const authService = new AuthService()

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"seeker" | "employer">("seeker")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证姓名
    if (!name) {
      toast.error("请输入姓名")
      return
    }

    if (name.length < 2) {
      toast.error("姓名长度至少2位")
      return
    }

    // 验证邮箱
    if (!email) {
      toast.error("请输入邮箱")
      return
    }

    if (!validateEmail(email)) {
      toast.error("请输入正确的邮箱格式")
      return
    }

    // 验证手机号
    if (!phone) {
      toast.error("请输入手机号")
      return
    }

    if (!validatePhone(phone)) {
      toast.error("请输入正确的手机号格式")
      return
    }

    // 验证密码
    if (!password) {
      toast.error("请输入密码")
      return
    }

    if (password.length < 6) {
      toast.error("密码长度至少6位")
      return
    }

    if (password.length > 20) {
      toast.error("密码长度不能超过20位")
      return
    }

    // 验证确认密码
    if (!confirmPassword) {
      toast.error("请确认密码")
      return
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }

    // 验证服务条款
    if (!agreeTerms) {
      toast.error("请同意服务条款和隐私政策")
      return
    }

    setIsLoading(true)
    try {
      const res = await authService.register(email, phone, password, confirmPassword, name, role)
      localStorage.setItem("token", res.token)
      localStorage.setItem("user", JSON.stringify(res.userInfo))
      toast.success("注册成功，正在为您跳转")

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push("/onboarding")
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "注册失败，请稍后重试")
      console.error("Register error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <Card className="relative w-full max-w-[480px] border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Briefcase className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">创建账号</CardTitle>
          <CardDescription className="text-base">开启您的脉刻招聘之旅</CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-5">
            {/* 角色选择 */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold ml-1">注册身份</Label>
              <RadioGroup
                defaultValue="seeker"
                value={role}
                onValueChange={(value) => setRole(value as "seeker" | "employer")}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="seeker" id="seeker" className="peer sr-only" />
                  <Label
                    htmlFor="seeker"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary"
                  >
                    <UserCircle className="mb-2 h-10 w-10 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-sm font-medium">求职者</span>
                    <span className="text-xs text-muted-foreground mt-1">寻找理想工作</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="employer" id="employer" className="peer sr-only" />
                  <Label
                    htmlFor="employer"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 [&:has([data-state=checked])]:border-primary"
                  >
                    <Building2 className="mb-2 h-10 w-10 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-sm font-medium">招聘者</span>
                    <span className="text-xs text-muted-foreground mt-1">招募优秀人才</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold ml-1">姓名</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                  <User className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <Input
                  id="name"
                  type="text"
                  placeholder="请输入真实姓名"
                  className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">邮箱</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                  <Mail className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 手机号 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold ml-1">手机号</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                  <Phone className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold ml-1">密码</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                  <Lock className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码（6-20位）"
                  className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* 确认密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold ml-1">确认密码</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                  <Lock className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="请再次输入密码"
                  className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* 服务条款 */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                required
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
              >
                我已阅读并同意 <Link href="/terms" className="underline hover:text-primary">服务条款</Link> 和 <Link href="/privacy" className="underline hover:text-primary">隐私政策</Link>
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-5 pt-2 pb-8">
            <Button
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "注册中..." : "立即注册"}
              {!isLoading && <Sparkles className="ml-2 h-4.5 w-4.5" />}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">已有账号？</span>
              <Button
                type="button"
                variant="link"
                className="text-primary p-0 h-auto ml-1"
                onClick={handleLogin}
              >
                立即登录
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                安全加密
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI 匹配
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>

      <p className="absolute bottom-8 text-xs text-muted-foreground/40">
        注册即代表同意 <Link href="/terms" className="underline hover:text-primary">用户协议</Link> 与 <Link href="/privacy" className="underline hover:text-primary">隐私政策</Link>
      </p>
    </div>
  )
}
