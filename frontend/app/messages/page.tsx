"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  Search,
  Send,
  Paperclip,
  Image,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft
} from "lucide-react"

interface Conversation {
  id: string
  name: string
  avatar?: string
  title: string
  company: string
  lastMessage: string
  time: string
  unread: number
  isOnline: boolean
}

interface Message {
  id: string
  content: string
  time: string
  isSelf: boolean
  status?: "sent" | "delivered" | "read"
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "张明",
    title: "高级前端工程师",
    company: "字节跳动",
    lastMessage: "您好，请问方便聊聊吗？",
    time: "刚刚",
    unread: 2,
    isOnline: true,
  },
  {
    id: "2",
    name: "李婷",
    title: "产品经理",
    company: "阿里巴巴",
    lastMessage: "好的，我看一下时间安排",
    time: "10分钟前",
    unread: 0,
    isOnline: true,
  },
  {
    id: "3",
    name: "王浩",
    title: "Java架构师",
    company: "腾讯",
    lastMessage: "简历已发送，请查收",
    time: "1小时前",
    unread: 0,
    isOnline: false,
  },
  {
    id: "4",
    name: "陈雪",
    title: "UI/UX设计师",
    company: "美团",
    lastMessage: "谢谢您的关注！",
    time: "昨天",
    unread: 1,
    isOnline: true,
  },
  {
    id: "5",
    name: "刘强",
    title: "数据工程师",
    company: "滴滴出行",
    lastMessage: "期待与您进一步沟通",
    time: "3天前",
    unread: 0,
    isOnline: false,
  },
]

const messages: Message[] = [
  {
    id: "1",
    content: "您好！我是TalentHub的招聘负责人，看到您的简历非常优秀。",
    time: "10:30",
    isSelf: true,
    status: "read",
  },
  {
    id: "2",
    content: "您好，感谢您的关注！请问是什么岗位呢？",
    time: "10:32",
    isSelf: false,
  },
  {
    id: "3",
    content: "我们目前在招聘高级前端工程师，薪资范围35-50K，团队氛围很好。",
    time: "10:35",
    isSelf: true,
    status: "read",
  },
  {
    id: "4",
    content: "听起来不错！可以详细介绍一下团队和项目吗？",
    time: "10:38",
    isSelf: false,
  },
  {
    id: "5",
    content: "当然可以！我们是一个20人左右的技术团队，主要负责公司核心产品的前端开发。技术栈是 React + TypeScript，有完善的工程化体系。",
    time: "10:40",
    isSelf: true,
    status: "read",
  },
  {
    id: "6",
    content: "您好，请问方便聊聊吗？",
    time: "10:45",
    isSelf: false,
  },
]

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(conversations[0])
  const [messageInput, setMessageInput] = useState("")
  const [showMobileChat, setShowMobileChat] = useState(false)

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    // Handle send message logic
    setMessageInput("")
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      
      <main className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <Card className="flex w-full overflow-hidden border-0 shadow-sm">
          {/* Conversation List */}
          <div className={cn(
            "flex w-full flex-col border-r border-border/40 md:w-80 lg:w-96",
            showMobileChat && "hidden md:flex"
          )}>
            {/* Search */}
            <div className="border-b border-border/40 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索会话..."
                  className="h-10 w-full rounded-full bg-accent pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversation(conv)
                      setShowMobileChat(true)
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                      activeConversation?.id === conv.id 
                        ? "bg-accent" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      {conv.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-[oklch(0.55_0.15_145)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate font-medium text-foreground">
                          {conv.name}
                        </h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {conv.time}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {conv.title} · {conv.company}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="truncate text-sm text-muted-foreground">
                          {conv.lastMessage}
                        </p>
                        {conv.unread > 0 && (
                          <Badge className="ml-2 h-5 w-5 shrink-0 rounded-full bg-primary p-0 text-xs text-primary-foreground">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "hidden flex-1 flex-col md:flex",
            showMobileChat && "flex"
          )}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden"
                      onClick={() => setShowMobileChat(false)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      {activeConversation.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-[oklch(0.55_0.15_145)]" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-medium text-foreground">
                        {activeConversation.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {activeConversation.title} · {activeConversation.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Video className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 sm:p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.isSelf ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5",
                            message.isSelf
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md bg-accent text-foreground"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className={cn(
                            "mt-1 flex items-center gap-1",
                            message.isSelf ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              message.isSelf ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {message.time}
                            </span>
                            {message.isSelf && message.status && (
                              <span className="text-primary-foreground/70">
                                {message.status === "read" ? (
                                  <CheckCheck className="h-3.5 w-3.5" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-border/40 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Image className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hidden rounded-full sm:flex">
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="输入消息..."
                        className="h-11 w-full rounded-full bg-accent px-4 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
                        disabled={!messageInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-accent p-6">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-medium text-foreground">选择一个会话</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  从左侧列表选择或搜索会话开始聊天
                </p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
