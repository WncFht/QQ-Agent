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

from .api_client import load_api_configs, create_api_client, APIClient

bot = CompatibleEnrollment  # 兼容回调函数注册器

class GroupManagerPlugin(BasePlugin):
    name = "GroupManagerPlugin"
    version = "1.0.0"
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.config = {
            "log_file": "data/group_manager_log.json",  # 存储在根目录的data文件夹中
        }
        
        # 确保数据目录存在
        os.makedirs(os.path.dirname(self.config["log_file"]), exist_ok=True)
        
        # 加载 API 配置
        await self.load_api_configs()
        
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        print(f"支持的 API: {[k for k in self.api_configs.keys() if k != 'default']}")
        print(f"默认 API: {self.api_configs.get('default', 'none')}")
    
    async def load_api_configs(self):
        """加载 API 配置"""
        # 获取插件目录路径
        plugin_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.path.join(plugin_dir, '.env')
        
        # 如果 .env 文件不存在，尝试从 .env.example 创建
        if not os.path.exists(env_path):
            example_path = os.path.join(plugin_dir, '.env.example')
            if os.path.exists(example_path):
                print(f"未找到 .env 文件，将从 .env.example 创建")
                try:
                    with open(example_path, 'r', encoding='utf-8') as example_file:
                        with open(env_path, 'w', encoding='utf-8') as env_file:
                            env_file.write(example_file.read())
                    print(f"已创建 .env 文件，请编辑该文件配置您的 API 密钥")
                except Exception as e:
                    print(f"创建 .env 文件失败: {str(e)}")
        
        # 加载 API 配置
        self.api_configs = load_api_configs(env_path)
        self.api_clients = {}
        
        # 初始化 API 客户端
        for api_name in self.api_configs.keys():
            if api_name != "default":
                client = create_api_client(api_name, self.api_configs)
                if client:
                    if await client.initialize():
                        self.api_clients[api_name] = client
                        print(f"成功初始化 API 客户端: {api_name}")
                    else:
                        print(f"初始化 API 客户端失败: {api_name}")
    
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
    
    async def handle_ai_command(self, msg: GroupMessage):
        """处理 AI 命令"""
        # 提取命令内容
        content = msg.raw_message.replace("AI", "").strip()
        
        # 如果内容为空，返回错误提示
        if not content:
            error_msg = MessageChain([
                Text("请提供问题内容，格式如下：\nAI <问题内容>")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            return
        
        # 检查是否指定了 API
        api_name = self.api_configs.get("default", "none")
        api_pattern = re.compile(r'@(\w+)')
        api_matches = api_pattern.findall(content)
        
        if api_matches:
            specified_api = api_matches[0].lower()
            if specified_api in self.api_clients:
                api_name = specified_api
                # 移除 @api 部分，只保留问题内容
                content = re.sub(r'@\w+', '', content).strip()
        
        # 如果没有可用的 API 客户端，返回错误提示
        if api_name == "none" or api_name not in self.api_clients:
            error_msg = MessageChain([
                Text("AI 服务未正确初始化，无法生成回答。请检查 .env 文件中的 API 配置。")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
            return
        
        # 生成回答
        try:
            client = self.api_clients[api_name]
            response = await client.generate_response(content)
            
            # 构建回答消息
            answer_msg = MessageChain([
                Text(f"问题：{content}\n\n回答：{response}")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=answer_msg)
            
            # 记录日志
            self.add_to_logs(
                operator_id=msg.sender.user_id,
                operator_name=msg.sender.nickname,
                group_id=msg.group_id,
                action="ai_query",
                target_id=msg.sender.user_id,
                target_name=msg.sender.nickname,
                content=content,
                timestamp=msg.time
            )
        except Exception as e:
            error_msg = MessageChain([
                Text(f"生成回答失败: {str(e)}")
            ])
            await self.api.post_group_msg(msg.group_id, rtf=error_msg)
    
    async def handle_help_command(self, msg, is_group=True):
        """处理/help命令"""
        help_text = """群管理插件使用帮助：
添加头衔 <头衔内容> - 为自己设置群头衔
AI <问题内容> - 使用 AI 回答问题
AI @baidu <问题内容> - 使用百度 API 回答问题
AI @openai <问题内容> - 使用 OpenAI API 回答问题
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
        elif msg.raw_message.startswith("AI"):
            await self.handle_ai_command(msg)
        elif msg.raw_message == "/group_manager_help":
            await self.handle_help_command(msg, is_group=True)
    
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        if msg.raw_message.startswith("AI"):
            # 在私聊中也支持 AI 命令
            # 这里需要模拟一个 GroupMessage 对象
            group_msg = GroupMessage(
                message=msg.message,
                raw_message=msg.raw_message,
                sender=msg.sender,
                time=msg.time,
                self_id=msg.self_id,
                group_id="private_" + str(msg.user_id)  # 使用特殊格式表示私聊
            )
            await self.handle_ai_command(group_msg)
        elif msg.raw_message == "/group_manager_help":
            await self.handle_help_command(msg, is_group=False) 