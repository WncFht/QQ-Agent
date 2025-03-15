import os
import json
import re
from typing import Dict, List, Tuple, Any, Optional, Union
from datetime import datetime, timedelta

from ncatbot.plugin import BasePlugin, CompatibleEnrollment
from ncatbot.core.message import GroupMessage, PrivateMessage
from ncatbot.core.element import (
    MessageChain,  # 消息链，用于组合多个消息元素
    Text,          # 文本消息
    Reply,         # 回复消息
    At,            # @某人
)

bot = CompatibleEnrollment  # 兼容回调函数注册器

class GroupManagerPlugin(BasePlugin):
    name = "GroupManagerPlugin"
    version = "1.0.0"
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.config = {
            "log_file": "data/group_manager_log.json",  # 存储在根目录的data文件夹中
        }
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        
        # 确保数据目录存在
        os.makedirs(os.path.dirname(self.config["log_file"]), exist_ok=True)
    
    async def on_unload(self):
        """插件卸载时执行的操作"""
        print(f"{self.name} 插件已卸载")
    
    def read_logs(self):
        """读取日志数据"""
        try:
            with open(self.config["log_file"], encoding="utf-8", mode="r") as f:
                return json.loads(f.read())
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def save_logs(self, logs=None):
        """保存日志数据"""
        if logs is None:
            logs = self.read_logs()
        os.makedirs(os.path.dirname(self.config["log_file"]), exist_ok=True)
        with open(self.config["log_file"], encoding="utf-8", mode="w") as f:
            f.write(json.dumps(logs, ensure_ascii=False, indent=4))
    
    def add_to_logs(self, operator_id, operator_name, group_id, action, target_id, target_name, content, timestamp):
        """添加操作到日志"""
        logs = self.read_logs()
        logs.append({
            "operator_id": operator_id,
            "operator_name": operator_name,
            "group_id": group_id,
            "action": action,
            "target_id": target_id,
            "target_name": target_name,
            "content": content,
            "timestamp": datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
        })
        # 只保留最近100条记录
        if len(logs) > 100:
            logs = logs[-100:]
        self.save_logs(logs)
    
    async def handle_set_title_command(self, msg: GroupMessage):
        """处理设置群头衔命令"""
        # 提取命令内容
        content = msg.raw_message.replace("添加头衔", "").strip()
        
        # 直接使用发送命令的用户作为目标用户
        target_id = msg.sender.user_id
        target_name = msg.sender.nickname
        
        # 如果头衔内容为空，返回错误提示
        if not content:
            error_msg = MessageChain([
                Text("请提供头衔内容，格式如下：\n添加头衔 <头衔内容>")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            return
        
        # 设置群头衔
        try:
            await self.set_group_special_title(
                group_id=msg.group_id,
                user_id=target_id,
                special_title=content
            )
            
            # 构建成功消息
            success_msg = MessageChain([
                Text(f"已成功为您设置群头衔：{content}")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=success_msg)
            
            # 记录日志
            self.add_to_logs(
                operator_id=msg.sender.user_id,
                operator_name=msg.sender.nickname,
                group_id=msg.group_id,
                action="set_title",
                target_id=target_id,
                target_name=target_name,
                content=content,
                timestamp=msg.time
            )
        except Exception as e:
            error_msg = MessageChain([
                Text(f"设置群头衔失败: {str(e)}\n可能是机器人权限不足或头衔内容不符合要求")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
    
    async def set_group_special_title(
        self, group_id: Union[int, str], user_id: Union[int, str], special_title: str
    ):
        """
        :param group_id: 群号
        :param user_id: QQ号
        :param special_title: 群头衔
        :return: 设置群头衔
        """
        return await self.api.set_group_special_title(
            group_id=group_id,
            user_id=user_id,
            special_title=special_title
        )
    
    async def handle_help_command(self, msg, is_group=True):
        """处理/help命令"""
        help_text = """群管理插件使用帮助：
添加头衔 <头衔内容> - 为自己设置群头衔
/group_manager_help - 查看群管理插件帮助"""
        
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
        if msg.raw_message.startswith("添加头衔"):
            await self.handle_set_title_command(msg)
        elif msg.raw_message == "/group_manager_help":
            await self.handle_help_command(msg, is_group=True)
    
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        if msg.raw_message == "/group_manager_help":
            await self.handle_help_command(msg, is_group=False) 