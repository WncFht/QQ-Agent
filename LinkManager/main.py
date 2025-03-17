import os
import re
import json
import asyncio
import aiohttp
import argparse
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime, timedelta

from ncatbot.plugin import BasePlugin, CompatibleEnrollment
from ncatbot.core.message import GroupMessage, PrivateMessage
from ncatbot.core.element import (
    MessageChain,  # 消息链，用于组合多个消息元素
    Text,          # 文本消息
    Reply,         # 回复消息
    At,            # @某人
    AtAll,         # @全体成员
    Dice,          # 骰子
    Face,          # QQ表情
    Image,         # 图片
    Json,          # JSON消息
    Music,         # 音乐分享 (网易云, QQ 音乐等)
    CustomMusic,   # 自定义音乐分享
    Record,        # 语音
    Rps,           # 猜拳
    Video,         # 视频
    File,          # 文件
)
bot = CompatibleEnrollment  # 兼容回调函数注册器

class LinkManagerPlugin(BasePlugin):
    name = "LinkManagerPlugin"
    version = "1.0.0"
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.config = {
            "links_file": "data/links.json",  # 存储在根目录的data文件夹中
            "link_timeout": 10,  # 链接检查超时时间（秒）
            "link_check_interval": 3600  # 链接检查间隔（秒）
        }
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        
        # 确保数据目录存在
        os.makedirs(os.path.dirname(self.config["links_file"]), exist_ok=True)
    
    async def on_unload(self):
        """插件卸载时执行的操作"""
        print(f"{self.name} 插件已卸载")
    
    def read_links(self):
        """读取链接数据"""
        try:
            with open(self.config["links_file"], encoding="utf-8", mode="r") as f:
                return json.loads(f.read())
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def save_links(self, links=None):
        """保存链接数据"""
        if links is None:
            links = self.read_links()
        os.makedirs(os.path.dirname(self.config["links_file"]), exist_ok=True)
        with open(self.config["links_file"], encoding="utf-8", mode="w") as f:
            f.write(json.dumps(links, ensure_ascii=False, indent=4))
    
    def is_valid_url(self, url):
        """检查是否是有效的URL"""
        url_pattern = re.compile(
            r'^(?:http|https)://'  # http:// 或 https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # 域名
            r'localhost|'  # localhost
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
            r'(?::\d+)?'  # 可选的端口
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return bool(url_pattern.match(url))
    
    def add_link(self, url: str, user_id: str, username: str, group_id: Optional[str] = None, 
                description: str = "", tags: List[str] = None, append: bool = False,
                update: bool = False) -> Tuple[bool, str]:
        """添加或更新链接"""
        links = self.read_links()
        tags = tags or []
        
        # 查找现有链接
        existing_link = None
        for link in links:
            if link.get("url") == url:
                existing_link = link
                break
        
        if existing_link:
            # 检查用户是否有该链接的描述
            user_has_desc = False
            user_desc_index = -1
            for i, desc in enumerate(existing_link.get("descriptions", [])):
                if desc["user_id"] == user_id:
                    user_has_desc = True
                    user_desc_index = i
                    break
            
            if update:
                # 更新模式：用户只能更新自己的描述
                if not user_has_desc:
                    return False, "你还没有为这个链接添加过描述，请使用普通的添加命令"
                
                if description:
                    existing_link["descriptions"][user_desc_index] = {
                        "content": description,
                        "user_id": user_id,
                        "username": username,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                message = "你的描述已更新"
            else:
                # 添加模式
                if append:
                    # 追加新描述
                    existing_link.setdefault("descriptions", []).append({
                        "content": description,
                        "user_id": user_id,
                        "username": username,
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                    message = "描述已追加"
                else:
                    # 如果用户已有描述，更新它；否则添加新描述
                    if user_has_desc:
                        if description:
                            existing_link["descriptions"][user_desc_index] = {
                                "content": description,
                                "user_id": user_id,
                                "username": username,
                                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            }
                        message = "你的描述已更新"
                    else:
                        if description:
                            existing_link.setdefault("descriptions", []).append({
                                "content": description,
                                "user_id": user_id,
                                "username": username,
                                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            })
                        message = "描述已添加"
            
            # 更新标签（所有用户都可以添加标签）
            if tags:
                existing_tags = set(existing_link.get("tags", []))
                existing_tags.update(tags)
                existing_link["tags"] = sorted(list(existing_tags))
                message += "，标签已更新"
        else:
            # 添加新链接
            new_link = {
                "url": url,
                "group_id": group_id,
                "creator_id": user_id,
                "creator_name": username,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "tags": sorted(tags),
                "descriptions": [{
                    "content": description,
                    "user_id": user_id,
                    "username": username,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }] if description else []
            }
            links.append(new_link)
            message = "链接添加成功"
        
        self.save_links(links)
        return True, message
    
    def search_links(self, keyword: str, group_id: Optional[str] = None, tag: Optional[str] = None) -> List[Dict]:
        """搜索链接"""
        links = self.read_links()
        results = []
        
        for link in links:
            # 如果指定了群号，则只搜索该群的链接
            if group_id and link.get("group_id") != group_id:
                continue
                
            # 如果指定了标签，检查标签是否匹配
            if tag and tag not in link.get("tags", []):
                continue
                
            # 搜索关键词
            descriptions = link.get("descriptions", [])
            desc_texts = [d["content"] for d in descriptions]
            
            if (keyword.lower() in link["url"].lower() or
                any(keyword.lower() in desc.lower() for desc in desc_texts)):
                results.append(link)
                
        return results
    
    def get_link_details(self, url: str, group_id: Optional[str] = None) -> Optional[Dict]:
        """获取链接的详细信息"""
        links = self.read_links()
        for link in links:
            if link.get("url") == url and (group_id is None or link.get("group_id") == group_id):
                # 添加状态信息到返回结果
                status_info = ""
                if not link.get("is_valid", True):
                    status_info = f"\n状态: 失效\n失效时间: {link.get('invalid_since')}\n原因: {link.get('status_message')}"
                link["status_info"] = status_info
                return link
        return None
    
    async def check_link_validity(self, url: str) -> Tuple[bool, str]:
        """检查链接是否有效"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=self.config["link_timeout"]) as response:
                    return response.status < 400, f"HTTP状态码: {response.status}"
        except asyncio.TimeoutError:
            return False, "请求超时"
        except Exception as e:
            return False, str(e)
    
    async def update_link_status(self, link: Dict, is_valid: bool, status_message: str):
        """更新链接状态"""
        link["last_checked"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        link["is_valid"] = is_valid
        link["status_message"] = status_message
        if not is_valid and not link.get("invalid_since"):
            link["invalid_since"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elif is_valid:
            link.pop("invalid_since", None)
    
    async def notify_creator(self, link: Dict):
        """通知创建者链接失效"""
        if not link.get("is_valid") and link.get("creator_id"):
            # 构建消息链，包含@创建者和通知内容
            message = MessageChain([
                At(link["creator_id"]),  # @创建者
                Text("\n您添加的链接已失效：\n"),
                Text(f"URL: {link['url']}\n"),
                Text(f"失效时间: {link.get('invalid_since')}\n"),
                Text(f"状态: {link.get('status_message')}\n"),
                Text("请检查并更新链接。")
            ])
            
            try:
                # 如果是群组链接，在群内发送通知
                if link.get("group_id"):
                    await self.api.post_group_msg(link["group_id"], rtf=message)
                # 如果是私聊链接，发送私聊消息
                else:
                    await self.api.post_private_msg(link["creator_id"], rtf=message)
            except Exception as e:
                print(f"无法通知用户 {link['creator_id']}: {e}")
                # 如果群发送失败，尝试私聊通知
                if link.get("group_id"):
                    try:
                        private_message = MessageChain([
                            Text(f"""您在群 {link['group_id']} 中添加的链接已失效：
URL: {link['url']}
失效时间: {link.get('invalid_since')}
状态: {link.get('status_message')}
请检查并更新链接。""")
                        ])
                        await self.api.post_private_msg(link["creator_id"], rtf=private_message)
                    except Exception as e2:
                        print(f"私聊通知也失败: {e2}")
    
    async def check_all_links(self):
        """检查所有链接的有效性"""
        links = self.read_links()
        for link in links:
            # 检查链接是否需要验证（上次检查时间超过间隔）
            last_checked = datetime.strptime(link.get("last_checked", "2000-01-01 00:00:00"), "%Y-%m-%d %H:%M:%S")
            if datetime.now() - last_checked < timedelta(seconds=self.config["link_check_interval"]):
                continue

            is_valid, status_message = await self.check_link_validity(link["url"])
            await self.update_link_status(link, is_valid, status_message)
            
            # 如果链接失效，通知创建者
            if not is_valid:
                await self.notify_creator(link)

        self.save_links(links)
    
    class CommandParser:
        """命令解析器"""
        @staticmethod
        def parse_add_command(content: str) -> Dict[str, Any]:
            parser = argparse.ArgumentParser(description='添加或更新链接')
            parser.add_argument('url', help='链接URL')
            parser.add_argument('-d', '--desc', help='链接描述', default='')
            parser.add_argument('-t', '--tags', help='标签，用逗号分隔', default='')
            parser.add_argument('-a', '--append', action='store_true', help='追加描述而不是覆盖')
            parser.add_argument('-u', '--update', action='store_true', help='更新自己的描述')
            
            try:
                # 将命令行风格的参数转换为列表
                args_list = []
                in_quotes = False
                current_arg = []
                
                for char in content:
                    if char == '"':
                        in_quotes = not in_quotes
                    elif char.isspace() and not in_quotes:
                        if current_arg:
                            args_list.append(''.join(current_arg))
                            current_arg = []
                    else:
                        current_arg.append(char)
                
                if current_arg:
                    args_list.append(''.join(current_arg))
                
                args = parser.parse_args(args_list)
                return {
                    'url': args.url,
                    'description': args.desc,
                    'tags': [tag.strip() for tag in args.tags.split(',') if tag.strip()],
                    'append': args.append,
                    'update': args.update
                }
            except Exception as e:
                return None

        @staticmethod
        def parse_view_command(content: str) -> Dict[str, Any]:
            parser = argparse.ArgumentParser(description='查看链接详情')
            parser.add_argument('url', help='链接URL')
            
            try:
                args = parser.parse_args(content.split())
                return {'url': args.url}
            except Exception as e:
                return None
    
    # 命令处理函数
    async def handle_website_command(self, msg, is_group=True):
        """处理网站命令"""
        message = MessageChain([
            Text("https://wncfht.github.io/Awesome-Tech-Share/")
        ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)

    async def handle_announcement_command(self, msg, is_group=True):
        """处理公告命令"""
        announcement = """1. 写文章、笔记、想法等等/分享资料
2. 总结主要内容，提取两三个关键词，附上链接发在群里，要求是便于他人查询即可。每周群主/管理员会同一收集更新到网站上
3.另外聊天讨论技术分享比较好的可以@群主/管理员收录

每周更新后会统一@所有人查看最新的提交记录"""
        
        message = MessageChain([
            Text(announcement)
        ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)

    async def handle_add_command(self, msg, is_group=True):
        """处理/add命令"""
        # 提取命令内容
        content = msg.raw_message.replace("/add", "").strip()
        
        if not content:
            error_msg = MessageChain([
                Text("""请提供要添加的链接和参数，格式如下：
/add <链接URL> [-d 描述] [-t 标签1,标签2] [-a|-u]
示例：
/add https://example.com -d "这是一个示例" -t "技术,教程" -a""")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 解析命令
        parsed = self.CommandParser.parse_add_command(content)
        if not parsed:
            error_msg = MessageChain([
                Text("命令格式错误，请检查参数格式")
            ])
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 验证URL
        if not self.is_valid_url(parsed["url"]):
            error_msg = MessageChain([
                Text("请输入正确的链接")
            ])
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 添加链接
        username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
        group_id = msg.group_id if is_group else None
        success, message_text = self.add_link(
            parsed["url"], 
            msg.sender.user_id, 
            username, 
            group_id, 
            parsed["description"],
            parsed["tags"],
            parsed["append"],
            parsed["update"]
        )
        
        message = MessageChain([Text(message_text)])
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)

    async def handle_search_command(self, msg, is_group=True):
        """处理/search命令"""
        content = msg.raw_message.replace("/search", "").strip()
        
        if not content:
            error_msg = MessageChain([
                Text("""请提供搜索关键词，格式如下：
/search <关键词> [-t 标签]
示例：
/search python -t 教程""")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 简单解析标签
        parts = content.split("-t")
        keyword = parts[0].strip()
        tag = parts[1].strip() if len(parts) > 1 else None
        
        # 搜索链接
        group_id = msg.group_id if is_group else None
        results = self.search_links(keyword, group_id, tag)
        
        if not results:
            message = MessageChain([
                Text("未找到相关链接")
            ])
        else:
            result_text = ""
            for link in results:
                # 添加URL和标签
                result_text += f"- {link['url']}"
                if link.get("tags"):
                    result_text += f" [标签: {', '.join(link['tags'])}]"
                result_text += "\n"
                
                # 添加描述
                for desc in link.get("descriptions", []):
                    result_text += f"  描述 ({desc['username']}): {desc['content']}\n"
                result_text += "\n"
            
            message = MessageChain([
                Text(result_text.strip())
            ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)

    async def handle_view_command(self, msg, is_group=True):
        """处理/view命令"""
        content = msg.raw_message.replace("/view", "").strip()
        
        if not content:
            error_msg = MessageChain([
                Text("""请提供要查看的链接，格式如下：
/view <链接URL>
示例：
/view https://example.com""")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 解析命令
        parsed = self.CommandParser.parse_view_command(content)
        if not parsed:
            error_msg = MessageChain([
                Text("命令格式错误，请检查URL格式")
            ])
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 获取链接详情
        group_id = msg.group_id if is_group else None
        link_details = self.get_link_details(parsed["url"], group_id)
        if not link_details:
            message = MessageChain([
                Text("未找到该链接")
            ])
        else:
            result_text = f"""链接详情：
URL: {link_details['url']}
创建者: {link_details['creator_name']}
创建时间: {link_details['created_at']}
标签: {', '.join(link_details['tags']) if link_details.get('tags') else '无'}{link_details.get('status_info', '')}

描述列表："""
            
            if link_details.get("descriptions"):
                for i, desc in enumerate(link_details["descriptions"], 1):
                    result_text += f"\n{i}. {desc['username']} ({desc['timestamp']}):\n   {desc['content']}"
            else:
                result_text += "\n暂无描述"
            
            message = MessageChain([
                Text(result_text)
            ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)

    async def handle_check_links_command(self, msg, is_group=True):
        """处理/check_links命令"""
        try:
            await self.check_all_links()
            message = MessageChain([
                Text("链接检查完成。所有链接已更新。")
            ])
        except Exception as e:
            message = MessageChain([
                Text(f"链接检查失败: {e}")
            ])

        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)

    async def handle_help_command(self, msg, is_group=True):
        """处理/help命令"""
        help_text = """可用指令列表：
/help - 查看所有可用指令
/add <链接URL> [-d 描述] [-t 标签1,标签2] [-a|-u] - 添加或更新链接
  -d: 添加描述
  -t: 添加标签（用逗号分隔）
  -a: 追加新描述（不覆盖已有描述）
  -u: 更新自己的描述
/view <链接URL> - 查看链接详细信息
/search <关键词> [-t 标签] - 搜索链接
/check_links - 手动检查链接有效性
网站 - 获取技术分享网站链接
公告 - 查看群公告"""
        
        message = MessageChain([
            Text(help_text)
        ])
        
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)
    
    # 事件处理
    @bot.group_event()
    async def on_group_message(self, msg: GroupMessage):
        """处理群聊消息"""
        if msg.raw_message == "网站":
            await self.handle_website_command(msg, is_group=True)
        elif msg.raw_message == "公告":
            await self.handle_announcement_command(msg, is_group=True)
        elif msg.raw_message.startswith("/add"):
            await self.handle_add_command(msg, is_group=True)
        elif msg.raw_message.startswith("/view"):
            await self.handle_view_command(msg, is_group=True)
        elif msg.raw_message.startswith("/search"):
            await self.handle_search_command(msg, is_group=True)
        elif msg.raw_message == "/help":
            await self.handle_help_command(msg, is_group=True)
        elif msg.raw_message.startswith("/check_links"):
            await self.handle_check_links_command(msg, is_group=True)
    
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        if msg.raw_message == "网站":
            await self.handle_website_command(msg, is_group=False)
        elif msg.raw_message == "公告":
            await self.handle_announcement_command(msg, is_group=False)
        elif msg.raw_message.startswith("/add"):
            await self.handle_add_command(msg, is_group=False)
        elif msg.raw_message.startswith("/view"):
            await self.handle_view_command(msg, is_group=False)
        elif msg.raw_message.startswith("/search"):
            await self.handle_search_command(msg, is_group=False)
        elif msg.raw_message == "/help":
            await self.handle_help_command(msg, is_group=False)
        elif msg.raw_message.startswith("/check_links"):
            await self.handle_check_links_command(msg, is_group=False)
    
    @bot.notice_event
    async def on_notice_event(self, msg):
        """处理通知事件"""
        if msg["notice_type"] == "group_increase":
            if msg["sub_type"] == "approve":
                # 获取用户信息
                t = await self.api.get_stranger_info(user_id=msg["user_id"])
                nickname = t["data"]["nickname"]
                
                # 构建欢迎消息
                welcome_message = f"""欢迎你进入群聊！🎉🎉🎉

我是该群的机器人助手，这是我的使用帮助:

/help 查看所有可用指令
/add 添加链接
/search 搜索链接"""
                
                message = MessageChain([
                    Text(f"{nickname}，你好！👋\n{welcome_message}"),
                    Text(f"\n[加入时间]: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                ])
                
                await self.api.post_group_msg(msg["group_id"], rtf=message) 