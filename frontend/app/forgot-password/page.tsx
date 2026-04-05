"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Briefcase, Mail, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// 认证服务
class AuthService {
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "请求失败，请稍后重试")
    }

    return response.json()
  }
}

const authService = new AuthService()

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("请输入邮箱地址")
      return
    }
    
    if (!validateEmail(email)) {
      toast.error("请输入正确的邮箱格式")
      return
    }

    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setIsSubmitted(true)
      toast.success("重置邮件已发送，请查看您的邮箱")
    } catch (error: any) {
      toast.error(error.message || "请求失败，请稍后重试")
      console.error("Forgot password error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/login")
  }

  if (isSubmitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        
        <Card className="relative w-full max-w-[480px] border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1.5 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Briefcase className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">重置邮件已发送</CardTitle>
            <CardDescription className="text-base">请查看您的邮箱并按照指引重置密码</CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <div className="rounded-xl border border-border/50 bg-accent/50 p-6">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                我们已向 <span className="font-medium text-foreground">{email}</span> 发送了密码重置邮件
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                邮件中包含重置链接，有效期为24小时
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 请检查您的收件箱（包括垃圾邮件文件夹）</p>
              <p>• 如果未收到邮件，请确认邮箱地址是否正确</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-6 pt-2 pb-8">
            <Button 
              className="w-full h-12 rounded-xl text-base font-bold" 
              onClick={handleBackToLogin}
            >
              返回登录
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      
      <Card className="relative w-full max-w-[480px] border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1.5 pb-8 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <Briefcase className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">忘记密码</CardTitle>
          <CardDescription className="text-base">我们将向您发送密码重置邮件</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleForgotPassword}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">注册邮箱</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary">
                  <Mail className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="请输入您的注册邮箱" 
                  className="pl-10 h-12 rounded-xl border-border/50 bg-background/50 focus-visible:ring-primary/30" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                我们将向此邮箱发送密码重置指引
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-6 pt-2 pb-8">
            <Button 
              className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "发送中..." : "发送重置邮件"}
              {!isLoading && <Sparkles className="ml-2 h-4.5 w-4.5" />}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">想起密码了？</span>
              <Button 
                type="button" 
                variant="link" 
                className="text-primary p-0 h-auto ml-1"
                onClick={handleBackToLogin}
              >
                返回登录
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
        <Link href="/terms" className="underline hover:text-primary">用户协议</Link> · <Link href="/privacy" className="underline hover:text-primary">隐私政策</Link>
      </p>
    </div>
  )
}
