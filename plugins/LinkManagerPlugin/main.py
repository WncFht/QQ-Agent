import os
import json
import re
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
from .link_manager import LinkManager

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
                },
                "auto_reply": True
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
            if "web_server" in self.config and "domain" in self.config["web_server"]:
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
            if "web_server" in self.config and "domain" in self.config["web_server"]:
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
/link_help - 显示此帮助信息"""
        
        # 添加Web端查看提示
        if "web_server" in self.config and "domain" in self.config["web_server"]:
            help_text += f"\n\n访问Web页面查看更多功能：https://{self.config['web_server']['domain']}"
        
        message = MessageChain([Text(help_text)])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)
    
    async def process_message(self, msg, is_group=True):
        """处理普通消息，提取链接"""
        # 使用正则表达式提取消息中的链接
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
