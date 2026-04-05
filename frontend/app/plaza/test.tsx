"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PlazaTest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          广场页面已创建成功！🎉
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          广场功能已基本实现，包含：
        </p>
        <ul className="text-left max-w-md mx-auto mb-8 space-y-2">
          <li>✅ 人才卡片展示组件</li>
          <li>✅ 搜索和筛选功能</li>
          <li>✅ 多种内容类型支持</li>
          <li>✅ 响应式设计</li>
          <li>✅ 模拟数据展示</li>
        </ul>
        <div className="space-x-4">
          <Link href="/plaza">
            <Button size="lg" className="px-8">
              前往广场
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="px-8">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}