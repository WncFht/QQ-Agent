# LinkManagerPlugin 修改架构设计

根据你的要求，我将帮你修改架构设计，采用 NextJS + TailwindCSS + Shadcn/ui 作为前端，Python/FastAPI 作为后端。以下是修改后的方案：

## 核心文件结构

### 后端结构
1. `__init__.py` - 插件入口
2. `main.py` - 插件主类及QQ机器人接口
3. `link_manager.py` - 核心链接管理类
4. `link_extractor.py` - 链接提取工具
5. `link_summarizer.py` - 链接内容总结
6. `link_classifier.py` - 标签分类器
7. `database.py` - 数据库操作封装
8. `config.py` - 配置管理
9. `prompts.py` - 提示词模板
10. `api_client.py` - LLM API客户端
11. `api/` - FastAPI应用目录
    - `main.py` - FastAPI应用入口
    - `routers/` - API路由模块
      - `links.py` - 链接相关API
      - `auth.py` - 认证相关API
      - `tags.py` - 标签相关API
    - `models/` - 数据模型
      - `link.py` - 链接相关模型
      - `user.py` - 用户相关模型
    - `dependencies/` - 依赖项
      - `auth.py` - 认证依赖
    - `middleware/` - 中间件

### 前端结构 (NextJS)
1. `frontend/` - NextJS应用目录
   - `app/` - App Router目录
     - `page.tsx` - 首页
     - `links/page.tsx` - 链接列表页
     - `links/[id]/page.tsx` - 链接详情页
     - `api/` - Next.js API路由
     - `layout.tsx` - 布局组件
   - `components/` - 组件目录
     - `ui/` - Shadcn UI组件
     - `link-card.tsx` - 链接卡片组件
     - `link-list.tsx` - 链接列表组件
     - `tag-selector.tsx` - 标签选择器组件
     - `search-bar.tsx` - 搜索栏组件
   - `lib/` - 工具库
     - `api.ts` - API客户端
     - `utils.ts` - 工具函数
   - `public/` - 静态资源
   - `tailwind.config.js` - TailwindCSS配置
   - `next.config.js` - Next.js配置
   - `package.json` - 依赖管理

## QQ机器人接口设计

基于NcatBot框架和DeclarationPlugin的实现，我们设计LinkManagerPlugin的QQ机器人接口如下：

### 插件入口与注册

在`__init__.py`中导出插件类：
```python
from .main import LinkManagerPlugin

__all__ = ["LinkManagerPlugin"]
```

### 主类实现

在`main.py`中实现主类，继承BasePlugin并使用兼容回调函数注册器：
```python
from ncatbot.plugin import BasePlugin, CompatibleEnrollment
from ncatbot.core.message import GroupMessage, PrivateMessage
from ncatbot.core.element import (
    MessageChain,  # 消息链，用于组合多个消息元素
    Text,          # 文本消息
    Reply,         # 回复消息
    At,            # @某人
    Image,         # 图片
    Json,          # JSON消息
)
bot = CompatibleEnrollment  # 兼容回调函数注册器

class LinkManagerPlugin(BasePlugin):
    name = "LinkManagerPlugin"
    version = "1.0.0"
    
    async def on_load(self):
        """插件加载时执行的操作"""
        # 初始化配置
        self.config = self.load_config()
        
        # 初始化组件
        self.link_manager = LinkManager(self.config)
        
        # 确保数据目录存在
        os.makedirs(os.path.dirname(self.config["database"]["path"]), exist_ok=True)
        
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        
    async def on_unload(self):
        """插件卸载时执行的操作"""
        # 清理资源
        print(f"{self.name} 插件已卸载")
    
    def load_config(self):
        """加载配置文件"""
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        try:
            with open(config_path, encoding="utf-8", mode="r") as f:
                return json.loads(f.read())
        except (FileNotFoundError, json.JSONDecodeError):
            # 返回默认配置
            return {
                "database": {
                    "path": "data/links.db"
                },
                "link_extraction": {
                    "url_regex": "https?://(?:[-\\w.]|(?:%[\\da-fA-F]{2}))+"
                },
                "commands": {
                    "view_links": "/view_links",
                    "add_link": "/add_link",
                    "search_links": "/search"
                }
            }
    
    # 使用装饰器注册事件处理函数
    @bot.group_event()
    async def on_group_message(self, msg: GroupMessage):
        """处理群聊消息"""
        # 处理命令
        if msg.raw_message.startswith(self.config["commands"]["view_links"]):
            await self.handle_view_links_command(msg, is_group=True)
        elif msg.raw_message.startswith(self.config["commands"]["add_link"]):
            await self.handle_add_link_command(msg, is_group=True)
        elif msg.raw_message.startswith(self.config["commands"]["search_links"]):
            await self.handle_search_command(msg, is_group=True)
        elif msg.raw_message == "/link_help":
            await self.handle_help_command(msg, is_group=True)
        else:
            # 处理普通消息，提取链接
            await self.process_message(msg, is_group=True)
        
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        # 处理命令
        if msg.raw_message.startswith(self.config["commands"]["view_links"]):
            await self.handle_view_links_command(msg, is_group=False)
        elif msg.raw_message.startswith(self.config["commands"]["add_link"]):
            await self.handle_add_link_command(msg, is_group=False)
        elif msg.raw_message.startswith(self.config["commands"]["search_links"]):
            await self.handle_search_command(msg, is_group=False)
        elif msg.raw_message == "/link_help":
            await self.handle_help_command(msg, is_group=False)
        else:
            # 处理普通消息，提取链接
            await self.process_message(msg, is_group=False)
```

### 命令处理

实现以下命令处理函数：
```python
async def handle_add_link_command(self, msg, is_group=True):
    """处理添加链接命令"""
    # 解析命令参数
    content = msg.raw_message.replace(self.config["commands"]["add_link"], "").strip()
    
    if not content:
        error_msg = MessageChain([
            Text("请提供链接URL和可选的描述，格式：\n/add_link <URL> [描述]")
        ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=error_msg)
        return
    
    # 分割URL和描述
    parts = content.split(" ", 1)
    url = parts[0]
    description = parts[1] if len(parts) > 1 else ""
    
    # 验证URL格式
    import re
    if not re.match(self.config["link_extraction"]["url_regex"], url):
        error_msg = MessageChain([
            Text("无效的URL格式，请检查后重试")
        ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=error_msg)
        return
    
    # 添加链接
    username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
    group_id = msg.group_id if is_group else None
    
    try:
        # 添加链接到数据库并获取摘要和标签
        result = await self.link_manager.add_link(
            url=url,
            sender_id=msg.sender.user_id,
            sender_name=username,
            group_id=group_id,
            description=description
        )
        
        # 构建回复消息
        response_text = f"链接已添加:\n标题: {result['title']}\n摘要: {result['summary']}\n标签: {', '.join(result['tags'])}"
        message = MessageChain([Text(response_text)])
        
    except Exception as e:
        response_text = f"添加链接失败: {str(e)}"
        message = MessageChain([Text(response_text)])
    
    # 发送响应
    if is_group:
        await self.api.post_group_msg(msg.group_id, rtf=message)
    else:
        await self.api.post_private_msg(msg.user_id, rtf=message)

async def handle_view_links_command(self, msg, is_group=True):
    """处理查看链接命令"""
    # 解析命令参数
    content = msg.raw_message.replace(self.config["commands"]["view_links"], "").strip()
    
    # 默认获取最近7天的链接
    days = 7
    limit = 5
    
    # 如果指定了天数
    if content:
        try:
            days = int(content)
            if days < 1:
                days = 1
            elif days > 30:
                days = 30
        except ValueError:
            pass
    
    # 获取链接
    group_id = msg.group_id if is_group else None
    links = await self.link_manager.get_recent_links(days=days, group_id=group_id, limit=limit)
    
    if not links:
        response_text = f"最近{days}天没有添加任何链接"
        message = MessageChain([Text(response_text)])
    else:
        # 构建链接列表文本
        links_text = "\n\n".join([
            f"标题: {link['title']}\nURL: {link['url']}\n摘要: {link['summary']}\n标签: {', '.join(link['tags'])}\n添加者: {link['sender_name']}"
            for link in links
        ])
        
        response_text = f"最近{days}天添加的链接（最多显示{limit}条）:\n\n{links_text}"
        
        # 添加Web端查看提示
        web_url = f"https://{self.config['web_server']['domain']}/links"
        response_text += f"\n\n查看更多请访问Web页面: {web_url}"
        
        message = MessageChain([Text(response_text)])
    
    # 发送响应
    if is_group:
        await self.api.post_group_msg(msg.group_id, rtf=message)
    else:
        await self.api.post_private_msg(msg.user_id, rtf=message)

async def handle_search_command(self, msg, is_group=True):
    """处理搜索链接命令"""
    # 解析搜索关键词
    content = msg.raw_message.replace(self.config["commands"]["search_links"], "").strip()
    
    if not content:
        error_msg = MessageChain([
            Text("请提供搜索关键词，格式：\n/search <关键词> [#标签1 #标签2 ...]")
        ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=error_msg)
        return
    
    # 提取标签
    import re
    tags = re.findall(r'#(\w+)', content)
    # 移除标签部分，得到纯关键词
    query = re.sub(r'#\w+', '', content).strip()
    
    # 执行搜索
    group_id = msg.group_id if is_group else None
    results = await self.link_manager.search_links(query=query, group_id=group_id, tags=tags)
    
    if not results:
        response_text = "未找到匹配的链接"
        message = MessageChain([Text(response_text)])
    else:
        # 构建搜索结果文本
        results_text = "\n\n".join([
            f"标题: {link['title']}\nURL: {link['url']}\n摘要: {link['summary']}\n标签: {', '.join(link['tags'])}"
            for link in results[:5]  # 最多显示5条结果
        ])
        
        response_text = f"搜索结果（显示前5条）:\n\n{results_text}"
        
        # 添加Web端查看提示
        web_url = f"https://{self.config['web_server']['domain']}/links?search={query}"
        response_text += f"\n\n查看更多请访问Web页面: {web_url}"
        
        message = MessageChain([Text(response_text)])
    
    # 发送响应
    if is_group:
        await self.api.post_group_msg(msg.group_id, rtf=message)
    else:
        await self.api.post_private_msg(msg.user_id, rtf=message)

async def handle_help_command(self, msg, is_group=True):
    """处理帮助命令"""
    help_text = f"""链接管理器使用帮助：
{self.config["commands"]["add_link"]} <URL> [描述] - 添加链接
{self.config["commands"]["view_links"]} [天数=7] - 查看最近链接
{self.config["commands"]["search_links"]} <关键词> [#标签1 #标签2] - 搜索链接
/link_help - 显示此帮助信息

访问Web页面查看更多功能：https://{self.config['web_server']['domain']}"""
    
    message = MessageChain([Text(help_text)])
    
    if is_group:
        await self.api.post_group_msg(msg.group_id, rtf=message)
    else:
        await self.api.post_private_msg(msg.user_id, rtf=message)
```

### 消息处理与链接提取

```python
async def process_message(self, msg, is_group=True):
    """处理普通消息，提取链接"""
    # 使用正则表达式提取消息中的链接
    import re
    urls = re.findall(self.config["link_extraction"]["url_regex"], msg.raw_message)
    
    if not urls:
        return
    
    # 获取发送者信息
    username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
    group_id = msg.group_id if is_group else None
    
    # 对提取的所有链接进行处理
    added_urls = []
    for url in urls:
        try:
            # 自动添加链接到数据库
            await self.link_manager.add_link(
                url=url,
                sender_id=msg.sender.user_id,
                sender_name=username,
                group_id=group_id
            )
            added_urls.append(url)
        except Exception as e:
            print(f"自动添加链接失败: {url}, 错误: {e}")
    
    # 如果成功添加了链接，可以选择性地回复一条消息
    if added_urls and self.config.get("auto_reply", True):
        response_text = f"已自动保存{len(added_urls)}个链接，可使用{self.config['commands']['view_links']}命令查看"
        message = MessageChain([Text(response_text)])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)
```

## 后端依赖项

在`requirements.txt`中列出依赖：
```
httpx>=0.23.0
asyncio>=3.4.3
fastapi>=0.95.0
uvicorn>=0.21.0
sqlalchemy>=1.4.0
openai>=0.27.0
python-dotenv>=0.19.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
```

## 数据库设计

保持原有SQLite设计不变。

## 配置管理

在 `config.json` 中增加前端配置和更多配置项：

```json
{
    "database": {
        "path": "data/links.db"
    },
    "llm_config": {
        "default_model": "chatglm3-6b",
        "models": {
            "chatglm3-6b": {
                "base_url": "http://127.0.0.1:8000/v1/",
                "api_key": "EMPTY",
                "type": "openai"
            },
            "bart-large-cnn": {
                "base_url": "http://127.0.0.1:8001/v1/",
                "api_key": "EMPTY",
                "type": "huggingface"
            }
        }
    },
    "api_server": {
        "host": "0.0.0.0",
        "port": 8000,
        "enable": true,
        "cors_origins": ["http://localhost:3000", "https://wncfht.fun"]
    },
    "frontend": {
        "dev_port": 3000,
        "build_dir": "frontend/.next"
    },
    "web_server": {
        "domain": "wncfht.fun",
        "use_ssl": true,
        "ssl_cert": "/path/to/cert.pem",
        "ssl_key": "/path/to/key.pem"
    },
    "link_extraction": {
        "url_regex": "https?://(?:[-\\w.]|(?:%[\\da-fA-F]{2}))+"
    },
    "commands": {
        "view_links": "/view_links",
        "add_link": "/add_link",
        "search_links": "/search"
    },
    "auth": {
        "secret_key": "your-secret-key-here",
        "algorithm": "HS256",
        "access_token_expire_minutes": 30
    },
    "auto_reply": true
}
```

## FastAPI实现

在`api/main.py`中实现FastAPI应用：

```python
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# 添加父目录到路径，以便导入插件模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import Database
from link_manager import LinkManager
from config import load_config
from .routers import links, auth, tags
from .dependencies.auth import get_current_user

# 加载配置
config = load_config()

app = FastAPI(
    title="LinkManager API",
    description="API for managing links from QQ chats",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config["api_server"]["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由器
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(links.router, prefix="/api/links", tags=["links"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok"}

# 启动应用
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config["api_server"]["host"],
        port=config["api_server"]["port"],
        reload=True
    )
```

## 前端实现 (NextJS + TailwindCSS + Shadcn/ui)

### 安装与配置

1. 创建NextJS项目：
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint
cd frontend
```

2. 安装Shadcn/ui：
```bash
npx shadcn-ui@latest init
```

3. 添加必要的Shadcn组件：
```bash
npx shadcn-ui@latest add button card input toast dialog dropdown-menu
```

### 页面设计

1. **主页 (page.tsx)**：
```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecentLinks } from '@/components/recent-links'
import { TagCloud } from '@/components/tag-cloud'
import { SearchBar } from '@/components/search-bar'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold">链接管理器</h1>
          <p className="text-xl text-muted-foreground">
            收集、整理和分享您的链接资源
          </p>
          <SearchBar />
        </section>
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">最近链接</h2>
              <Button asChild variant="outline">
                <Link href="/links">查看全部</Link>
              </Button>
            </div>
            <RecentLinks />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">热门标签</h2>
            <TagCloud />
          </div>
        </section>
      </div>
    </main>
  )
}
```

2. **链接列表页 (links/page.tsx)**：
```tsx
'use client'

import { useState } from 'react'
import { LinkList } from '@/components/link-list'
import { TagSelector } from '@/components/tag-selector'
import { SearchBar } from '@/components/search-bar'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

export default function LinksPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">链接库</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-3">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索链接..."
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新添加</SelectItem>
            <SelectItem value="oldest">最早添加</SelectItem>
            <SelectItem value="popular">最受欢迎</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <TagSelector 
            selectedTags={selectedTags} 
            onChange={setSelectedTags} 
          />
        </div>
        
        <div className="md:col-span-3">
          <LinkList 
            tags={selectedTags}
            sortBy={sortBy}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  )
}
```

3. **链接详情页 (links/[id]/page.tsx)**：
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { LinkDescriptions } from '@/components/link-descriptions'
import { AddDescriptionForm } from '@/components/add-description-form'

export default function LinkDetailPage() {
  const { id } = useParams()
  const [link, setLink] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchLink = async () => {
      setLoading(true)
      try {
        const data = await api.getLink(id)
        setLink(data)
      } catch (error) {
        console.error('Error fetching link:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLink()
  }, [id])
  
  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }
  
  if (!link) {
    return <div className="text-center py-12">未找到链接</div>
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {link.title || link.url}
            </a>
          </CardTitle>
          <CardDescription>
            添加者: {link.sender_name} · 添加于: {new Date(link.created_at).toLocaleString('zh-CN')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {link.summary && (
            <div>
              <h3 className="font-semibold mb-1">摘要</h3>
              <p>{link.summary}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {link.tags.map(tag => (
                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button asChild variant="outline">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              访问链接
            </a>
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-6">
        <h2 className="text-xl font-bold">描述 ({link.descriptions.length})</h2>
        <LinkDescriptions descriptions={link.descriptions} />
        <AddDescriptionForm linkId={id} />
      </div>
    </div>
  )
}
```

### 主要组件

1. **LinkCard组件 (components/link-card.tsx)**：
```tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface LinkCardProps {
  link: {
    id: string
    url: string
    title?: string
    summary?: string
    tags: { id: string, name: string }[]
    sender_name: string
    created_at: string
  }
}

export function LinkCard({ link }: LinkCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">
          <Link href={`/links/${link.id}`} className="hover:underline">
            {link.title || link.url}
          </Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow">
        {link.summary && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{link.summary}</p>
        )}
        
        <div className="flex flex-wrap gap-1 mt-2">
          {link.tags.map(tag => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        由 {link.sender_name} 添加于 {new Date(link.created_at).toLocaleDateString('zh-CN')}
      </CardFooter>
    </Card>
  )
}
```

2. **API客户端 (lib/api.ts)**：
```tsx
import { toast } from '@/components/ui/use-toast'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `请求失败: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API请求错误:', error)
    toast({
      title: '请求错误',
      description: error.message || '发生未知错误',
      variant: 'destructive',
    })
    throw error
  }
}

export const api = {
  // 链接相关API
  getLinks: (params?: { page?: number; limit?: number; tag?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.tag) query.set('tag', params.tag)
    if (params?.search) query.set('search', params.search)
    
    return request<any>(`/links?${query.toString()}`)
  },
  
  getLink: (id: string) => request<any>(`/links/${id}`),
  
  addLink: (data: { url: string; description?: string; tags?: string[] }) =>
    request<any>('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  addDescription: (linkId: string, content: string) =>
    request<any>(`/links/${linkId}/descriptions`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  
  // 标签相关API
  getTags: () => request<any>('/tags'),
  
  // 认证相关API
  login: (credentials: { username: string; password: string }) =>
    request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData: { username: string; password: string; email: string }) =>
    request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
}
```

## Nginx配置

更新Nginx配置以支持前端和后端:

```nginx
server {
    listen 80;
    server_name wncfht.fun;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name wncfht.fun;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/QQ-Agent/plugins/LinkManagerPlugin/frontend/.next/server/app;
        try_files $uri $uri.html $uri/index.html =404;
    }

    # 静态资源
    location /_next/static {
        alias /path/to/QQ-Agent/plugins/LinkManagerPlugin/frontend/.next/static;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # API请求
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Supervisor配置

更新Supervisor配置:

```ini
[program:qq-agent]
command=/path/to/venv/bin/python /path/to/QQ-Agent/main.py
directory=/path/to/QQ-Agent
autostart=true
autorestart=true
stderr_logfile=/var/log/qq-agent.err.log
stdout_logfile=/var/log/qq-agent.out.log

[program:link-manager-api]
command=/path/to/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
directory=/path/to/QQ-Agent/plugins/LinkManagerPlugin
autostart=true
autorestart=true
stderr_logfile=/var/log/link-manager-api.err.log
stdout_logfile=/var/log/link-manager-api.out.log
```
