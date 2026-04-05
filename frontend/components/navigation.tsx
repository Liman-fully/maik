"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Briefcase,
  FileText,
  Search,
  Bell,
  Crown,
  Upload,
  LogIn,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Settings,
  Shield,
} from "lucide-react";
import { ChevronDown } from "lucide-react";

interface NavUser {
  name: string;
  role: "hr" | "job_seeker";
  vipLevel?: number;
}

interface NavMenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

interface NavBenefit {
  name: string;
  desc: string;
  icon: React.ComponentType<any>;
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [vipOpen, setVipOpen] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProfileOpen(false);
    router.push("/login");
  };

  const menuItems: NavMenuItem[] = [
    { name: "职位管理", href: "/jobs", icon: Briefcase },
    { name: "简历库", href: "/resumes", icon: Users },
    { name: "搜索人才", href: "/search", icon: Search },
    { name: "我的消息", href: "/messages", icon: Bell, badge: "3" },
  ];

  const vipBenefits: NavBenefit[] = [
    { name: "无限浏览", desc: "查看所有人才信息", icon: Users },
    { name: "优先展示", desc: "职位排名靠前", icon: Crown },
    { name: "专属顾问", desc: "1v1 求职指导", icon: Shield },
  ];

  const createIcon = (IconComponent: React.ComponentType<any>, className: string) => {
    return React.createElement(IconComponent, { className });
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur",
          isScrolled
            ? "border-border/40 bg-background/80"
            : "border-transparent bg-background/60"
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-12">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">HuntLink</span>
            </Link>

            <nav className="hidden md:flex">
              <div className="flex items-center gap-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {createIcon(item.icon, cn("h-5 w-5", isActive && "text-primary"))}
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden gap-1.5 text-xs md:flex"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="h-3 w-3" />
                  上传简历
                </Button>

                <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-accent">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-xs font-medium text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden text-sm font-medium md:block">
                        {user.name}
                      </span>
                      <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="end" className="w-72 p-0" sideOffset={8}>
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-sm font-medium text-primary-foreground">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">
                              {user.name}
                            </span>
                            <Popover open={vipOpen} onOpenChange={setVipOpen}>
                              <PopoverTrigger asChild>
                                <button className="ml-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-medium text-white transition-transform hover:scale-105">
                                  <Crown className="h-2.5 w-2.5" />
                                  VIP
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="bottom" align="start" className="w-64 p-0" sideOffset={4}>
                                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 text-white">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Crown className="h-4 w-4" />
                                      <span className="font-semibold">VIP会员权益</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-2">
                                  {vipBenefits.map((benefit) => (
                                    <div key={benefit.name} className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-accent/50">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                        {createIcon(benefit.icon, "h-3.5 w-3.5 text-amber-600")}
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-foreground">{benefit.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{benefit.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.role === "hr" ? "招聘者" : "求职者"}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5">
                      {menuItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                        >
                          {createIcon(item.icon, "h-4 w-4 text-muted-foreground")}
                          {item.name}
                          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/50" />
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-border/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">显示人才数量</span>
                        <Switch checked={showCount} onCheckedChange={setShowCount} />
                      </div>
                    </div>

                    <div className="border-t border-border/40 p-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        退出登录
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <Button size="sm" className="rounded-full px-4" onClick={() => router.push("/login")}>
                <LogIn className="mr-1.5 h-4 w-4" />
                登录 / 注册
              </Button>
            )}

            <button
              className="ml-1 rounded-lg p-2 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border/40 bg-background p-4 md:hidden">
            <div className="mb-4 flex flex-col gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {createIcon(item.icon, "h-4 w-4")}
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Upload Resume Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              上传简历
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50">
              <Upload className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">拖拽文件到此处，或点击选择</p>
              <p className="mt-1 text-xs text-muted-foreground">
                支持 PDF、Word、图片格式
              </p>
            </div>
            <Button size="sm" className="mt-4 rounded-full">
              选择文件
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
