"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, Smartphone } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// API 基础路径
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

// 认证服务接口
interface AuthResponse {
  token: string
  userInfo: any
}

class AuthService {
  // 账号密码登录
  async loginWithAccount(identifier: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login/account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "登录失败")
    }

    return response.json()
  }

  // 发送验证码
  async sendCode(phone: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/auth/send-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "发送验证码失败")
    }
  }

  // 手机验证码登录
  async loginWithCode(phone: string, code: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login/code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "登录失败")
    }

    return response.json()
  }
}

const authService = new AuthService()

export default function LoginPage() {
  const router = useRouter()

  // 账号密码登录状态
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // 手机验证码登录状态
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [isSendingCode, setIsSendingCode] = useState(false)

  // 通用状态
  const [isLoading, setIsLoading] = useState(false)

  // 验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 验证手机号格式
  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone) {
      toast.error("请输入手机号")
      return
    }

    if (!validatePhone(phone)) {
      toast.error("请输入正确的手机号格式")
      return
    }

    setIsSendingCode(true)
    try {
      await authService.sendCode(phone)
      toast.success("验证码已发送")
      setCountdown(60)
    } catch (error: any) {
      toast.error(error.message || "发送验证码失败")
      console.error("Send code error:", error)
    } finally {
      setIsSendingCode(false)
    }
  }

  // 账号密码登录
  const handleAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!identifier) {
      toast.error("请输入邮箱或手机号")
      return
    }

    if (!password) {
      toast.error("请输入密码")
      return
    }

    if (password.length < 6) {
      toast.error("密码长度至少6位")
      return
    }

    setIsLoading(true)
    try {
      const res = await authService.loginWithAccount(identifier, password)
      localStorage.setItem("token", res.token)
      localStorage.setItem("user", JSON.stringify(res.userInfo))
      toast.success("登录成功，正在为您跳转")

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "登录失败，请检查账号和密码")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 手机验证码登录
  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone) {
      toast.error("请输入手机号")
      return
    }

    if (!validatePhone(phone)) {
      toast.error("请输入正确的手机号格式")
      return
    }

    if (!code) {
      toast.error("请输入验证码")
      return
    }

    if (code.length !== 6) {
      toast.error("验证码长度应为6位")
      return
    }

    setIsLoading(true)
    try {
      const res = await authService.loginWithCode(phone, code)
      localStorage.setItem("token", res.token)
      localStorage.setItem("user", JSON.stringify(res.userInfo))
      toast.success("登录成功，正在为您跳转")

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || "登录失败，请检查验证码")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = () => {
    router.push("/register")
  }

  const handleForgotPassword = () => {
    router.push("/forgot-password")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <Card className="relative w-full max-w-[420px] border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Briefcase className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">脉刻 MAIK</CardTitle>
          <CardDescription className="text-base">极致简约的社交招聘体验</CardDescription>
        </CardHeader>

        <CardContent className="pb-2">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 rounded-xl">
              <TabsTrigger
                value="account"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Lock className="h-4 w-4" />
                账号密码
              </TabsTrigger>
              <TabsTrigger
                value="sms"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Smartphone className="h-4 w-4" />
                手机验证码
              </TabsTrigger>
            </TabsList>

            {/* 账号密码登录 */}
            <TabsContent value="account">
              <form onSubmit={handleAccountLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-semibold ml-1">邮箱或手机号</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                      <User className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="请输入邮箱或手机号"
                      className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold ml-1">密码</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                      <Lock className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
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

                <Button
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "登录中..." : "立即登录"}
                  {!isLoading && <Sparkles className="ml-2 h-4.5 w-4.5" />}
                </Button>
              </form>
            </TabsContent>

            {/* 手机验证码登录 */}
            <TabsContent value="sms">
              <form onSubmit={handleCodeLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold ml-1">手机号</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                      <Smartphone className="h-4.5 w-4.5 text-muted-foreground" />
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

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold ml-1">验证码</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                      <Lock className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <Input
                      id="code"
                      type="text"
                      placeholder="请输入6位验证码"
                      className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-xs font-medium text-muted-foreground hover:text-primary disabled:opacity-50"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isSendingCode}
                    >
                      {countdown > 0 ? `${countdown}秒后重试` : "获取验证码"}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "登录中..." : "立即登录"}
                  {!isLoading && <Sparkles className="ml-2 h-4.5 w-4.5" />}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col gap-5 pt-4 pb-8">
          <div className="flex items-center justify-between w-full text-sm">
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground hover:text-primary p-0 h-auto"
              onClick={handleRegister}
            >
              立即注册
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-muted-foreground hover:text-primary p-0 h-auto"
              onClick={handleForgotPassword}
            >
              忘记密码？
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
      </Card>

      <p className="absolute bottom-8 text-xs text-muted-foreground/40">
        登录即代表同意 <Link href="/terms" className="underline hover:text-primary">用户协议</Link> 与 <Link href="/privacy" className="underline hover:text-primary">隐私政策</Link>
      </p>
    </div>
  )
}
