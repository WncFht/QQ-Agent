# LinkManagerPlugin 架构设计

## 核心文件结构
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
12. `frontend/` - NextJS应用目录
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

### 依赖项

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
使用 SQLite 作为数据库，轻量级且无需额外服务：

```sql
CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    summary TEXT,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    group_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE link_tags (
    link_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (link_id, tag_id),
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE descriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);
```

## 配置管理
在 `config.json` 中配置：

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

## 类设计

### 1. LinkManager 类
```python
class LinkManager:
    def __init__(self, config):
        self.config = config
        self.db = Database(config['database']['path'])
        self.extractor = LinkExtractor(config['link_extraction'])
        self.summarizer = LinkSummarizer(config['llm_config'])
        self.classifier = LinkClassifier(config['llm_config'])
        
    def process_message(self, message, sender_id, sender_name, group_id=None):
        # 处理消息，提取链接
        
    def add_link(self, url, sender_id, sender_name, group_id=None, description="", tags=None):
        # 添加链接到数据库
        
    def get_recent_links(self, days=7, group_id=None):
        # 获取最近n天的链接
        
    def search_links(self, query, group_id=None, tags=None):
        # 搜索链接
        
    def handle_command(self, command, args, sender_id, group_id=None):
        # 处理命令
```

### 2. Database 类
```python
class Database:
    def __init__(self, db_path):
        self.db_path = db_path
        self.engine = create_engine(f'sqlite:///{db_path}')
        self.session_factory = sessionmaker(bind=self.engine)
        self.Base = declarative_base()
        self.init_db()
        
    def init_db(self):
        # 初始化数据库表结构
        
    def add_link(self, url, sender_id, sender_name, group_id=None):
        # 添加链接
        
    def add_description(self, link_id, content, user_id, username):
        # 添加描述
        
    def add_tags(self, link_id, tags):
        # 添加标签
        
    def get_links(self, filters=None, limit=100, offset=0):
        # 获取链接列表
        
    def search_links(self, keyword, group_id=None, tags=None):
        # 搜索链接
```

### 3. LLM工厂模式
```python
class LLMFactory:
    @staticmethod
    def create_llm(config):
        llm_type = config.get('type', 'openai')
        if llm_type == 'openai':
            return OpenAILLM(config)
        elif llm_type == 'huggingface':
            return HuggingFaceLLM(config)
        else:
            raise ValueError(f"不支持的LLM类型: {llm_type}")
```


## 网站

参考 fonted.md

## 提示词管理
在 `prompts.py` 中定义各种提示词模板：

```python
SUMMARY_PROMPT = """
请为以下网页内容生成一个简短的摘要（50字以内）：
{content}
"""

CLASSIFICATION_PROMPT = """
请为以下网页内容生成1-3个合适的标签：
{content}

标签应该简短且能反映内容主题。请以逗号分隔的形式返回，例如：技术,编程,Python
"""

LINK_LIST_PROMPT = """
以下是最近{days}天内分享的链接：

{links}

请对这些链接进行简要总结，并按主题分类整理。
"""
```

## 实现步骤
1. 创建基础文件结构
2. 实现数据库模块
3. 实现链接提取功能
4. 实现LLM基类和子类
5. 实现链接总结和分类功能
6. 开发命令处理逻辑
7. 实现Web服务器和API
8. 开发前端页面
9. 配置域名和SSL
10. 部署到服务器
11. 测试和优化
