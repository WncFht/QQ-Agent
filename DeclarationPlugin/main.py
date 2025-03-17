import os
import json
import httpx
import asyncio
from typing import Dict, List, Tuple, Any, Optional

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

class DeclarationPlugin(BasePlugin):
    name = "DeclarationPlugin"
    version = "1.0.0"
    
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.config = {
            "history_file": "data/declaration_history.json",  # 存储在根目录的data文件夹中
            "api_url": "https://api.lovelive.tools/api/SweetNothings",
            "timeout": 10  # API请求超时时间（秒）
        }
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        
        # 确保数据目录存在
        os.makedirs(os.path.dirname(self.config["history_file"]), exist_ok=True)
    
    async def on_unload(self):
        """插件卸载时执行的操作"""
        print(f"{self.name} 插件已卸载")
    
    def read_history(self):
        """读取历史记录数据"""
        try:
            with open(self.config["history_file"], encoding="utf-8", mode="r") as f:
                return json.loads(f.read())
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def save_history(self, history=None):
        """保存历史记录数据"""
        if history is None:
            history = self.read_history()
        os.makedirs(os.path.dirname(self.config["history_file"]), exist_ok=True)
        with open(self.config["history_file"], encoding="utf-8", mode="w") as f:
            f.write(json.dumps(history, ensure_ascii=False, indent=4))
    
    async def get_declaration(self) -> Optional[str]:
        """获取随机表白语句"""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url=self.config["api_url"], timeout=self.config["timeout"])
            return resp.text
        except Exception as e:
            print(f'表白接口返回值异常，错误信息：{e}')
            return None
    
    def add_to_history(self, user_id, username, group_id, target, content):
        """添加表白到历史记录"""
        history = self.read_history()
        history.append({
            "user_id": user_id,
            "username": username,
            "group_id": group_id,
            "target": target,
            "content": content,
            "timestamp": asyncio.get_event_loop().time()
        })
        # 只保留最近100条记录
        if len(history) > 100:
            history = history[-100:]
        self.save_history(history)
    
    async def handle_declaration_command(self, msg, is_group=True):
        """处理表白命令"""
        content = msg.raw_message.replace("表白", "").strip()
        
        if not content:
            error_msg = MessageChain([
                Text("""你要表白谁捏？""")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 获取表白语句
        declaration_text = await self.get_declaration()
        
        if not declaration_text:
            error_msg = MessageChain([
                Text("获取表白语句失败，请稍后再试")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 构建回复消息
        result_text = f"表白 {content}：\n{declaration_text}"
        message = MessageChain([Text(result_text)])
        
        # 发送消息
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)
        
        # 记录历史
        username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
        group_id = msg.group_id if is_group else None
        self.add_to_history(msg.sender.user_id, username, group_id, content, declaration_text)
    
    async def handle_help_command(self, msg, is_group=True):
        """处理/help命令"""
        help_text = """表白插件使用帮助：
表白 <对象> - 向指定对象表白
/declaration_help - 查看表白插件帮助"""
        
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
        if msg.raw_message.startswith("表白"):
            await self.handle_declaration_command(msg, is_group=True)
        elif msg.raw_message == "/declaration_help":
            await self.handle_help_command(msg, is_group=True)
    
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        if msg.raw_message.startswith("表白"):
            await self.handle_declaration_command(msg, is_group=False)
        elif msg.raw_message == "/declaration_help":
            await self.handle_help_command(msg, is_group=False) 