import os
import json
import random
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

class CoupletPlugin(BasePlugin):
    name = "CoupletPlugin"
    version = "1.0.0"
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.config = {
            "history_file": "data/couplet_history.json",  # 存储在根目录的data文件夹中
            "api_url": "https://seq2seq-couplet-model.rssbrain.com/v0.2/couplet/",
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
    
    async def generate_couplet(self, shanglian, is_random=False) -> str:
        """生成对联"""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url=self.config["api_url"] + shanglian, timeout=self.config["timeout"])
            response = resp.json()['output']
        except Exception as e:
            print(f'对联接口返回值异常，上联：{shanglian}，错误信息：{e}')
            return '服务器出错啦，请稍后再试'
        
        if not response:
            print(f'对联接口返回空值，上联：{shanglian}')
            return '服务器出错啦，请稍后再试'
        
        if is_random:
            return random.choice(response)
        else:
            # 过滤敏感内容
            for item in response:
                if self.is_safe_content(item):
                    return item
            return '生成的内容不适合展示，请尝试其他上联'
    
    def is_safe_content(self, content):
        """检查内容是否安全（可以根据需要添加敏感词过滤）"""
        sensitive_words = ['李克强']  # 示例敏感词列表
        for word in sensitive_words:
            if word in content:
                return False
        return True
    
    def add_to_history(self, user_id, username, group_id, shanglian, xialian):
        """添加对联到历史记录"""
        history = self.read_history()
        history.append({
            "user_id": user_id,
            "username": username,
            "group_id": group_id,
            "shanglian": shanglian,
            "xialian": xialian,
            "timestamp": asyncio.get_event_loop().time()
        })
        # 只保留最近100条记录
        if len(history) > 100:
            history = history[-100:]
        self.save_history(history)
    
    async def handle_couplet_command(self, msg, is_group=True):
        """处理对联命令"""
        content = msg.raw_message.replace("对联 ", "").strip()
        
        if not content:
            error_msg = MessageChain([
                Text("""请提供上联，格式如下：
对联 <上联>
示例：
对联 海上生明月""")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 生成对联
        xialian = await self.generate_couplet(content)
        
        # 构建回复消息
        result_text = f"上联：{content}\n下联：{xialian}"
        message = MessageChain([Text(result_text)])
        
        # 发送消息
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)
        
        # 记录历史
        username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
        group_id = msg.group_id if is_group else None
        self.add_to_history(msg.sender.user_id, username, group_id, content, xialian)
    
    async def handle_random_couplet_command(self, msg, is_group=True):
        """处理随机对联命令"""
        content = msg.raw_message.replace("对对联 ", "").strip()
        
        if not content:
            error_msg = MessageChain([
                Text("""请提供上联，格式如下：
对对联 <上联>
示例：
对对联 海上生明月""")
            ])
            
            if is_group:
                await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            else:
                await self.api.post_private_msg(msg.user_id, rtf=error_msg)
            return
        
        # 生成随机对联
        xialian = await self.generate_couplet(content, is_random=True)
        
        # 构建回复消息
        result_text = f"上联：{content}\n下联：{xialian}"
        message = MessageChain([Text(result_text)])
        
        # 发送消息
        if is_group:
            await self.api.post_group_msg(msg.group_id, rtf=message)
        else:
            await self.api.post_private_msg(msg.user_id, rtf=message)
        
        # 记录历史
        username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
        group_id = msg.group_id if is_group else None
        self.add_to_history(msg.sender.user_id, username, group_id, content, xialian)
    
    async def handle_help_command(self, msg, is_group=True):
        """处理/help命令"""
        help_text = """对联插件使用帮助：
对联 <上联> - 生成对应的下联
对对联 <上联> - 随机生成对应的下联
/couplet_help - 查看对联插件帮助"""
        
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
        if msg.raw_message.startswith("对联 "):
            await self.handle_couplet_command(msg, is_group=True)
        elif msg.raw_message.startswith("对对联 "):
            await self.handle_random_couplet_command(msg, is_group=True)
        elif msg.raw_message == "/couplet_help":
            await self.handle_help_command(msg, is_group=True)
    
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        if msg.raw_message.startswith("对联 "):
            await self.handle_couplet_command(msg, is_group=False)
        elif msg.raw_message.startswith("对对联 "):
            await self.handle_random_couplet_command(msg, is_group=False)
        elif msg.raw_message == "/couplet_help":
            await self.handle_help_command(msg, is_group=False) 