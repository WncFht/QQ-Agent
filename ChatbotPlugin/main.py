import os
import json
import time
from typing import Dict, List, Optional, Any
import re
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from ncatbot.plugin import BasePlugin, CompatibleEnrollment
from ncatbot.core.message import GroupMessage, PrivateMessage
from ncatbot.core.element import (
    MessageChain,
    Text,
    Reply,
    At,
)

bot = CompatibleEnrollment  # 兼容回调函数注册器

class ChatbotPlugin(BasePlugin):
    name = "ChatbotPlugin"
    version = "1.0.0"
    
    def load_env_variables(self) -> Dict:
        """从.env文件加载环境变量"""
        # 获取插件目录路径
        plugin_dir = os.path.dirname(os.path.abspath(__file__))
        env_path = os.path.join(plugin_dir, '.env')
        
        # 如果.env文件不存在，尝试从.env.example创建
        if not os.path.exists(env_path):
            example_path = os.path.join(plugin_dir, '.env.example')
            if os.path.exists(example_path):
                print(f"未找到.env文件，将从.env.example创建")
                try:
                    with open(example_path, 'r', encoding='utf-8') as example_file:
                        with open(env_path, 'w', encoding='utf-8') as env_file:
                            env_file.write(example_file.read())
                    print(f"已创建.env文件，请编辑该文件配置您的API密钥")
                except Exception as e:
                    print(f"创建.env文件失败: {str(e)}")
        
        # 加载.env文件
        load_dotenv(env_path)
        
        # 构建API配置
        api_configs = {}
        
        # 加载DeepSeek配置
        if os.getenv("DEEPSEEK_API_KEY"):
            api_configs["deepseek"] = {
                "base_url": os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1/"),
                "api_key": os.getenv("DEEPSEEK_API_KEY"),
                "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                "params": {
                    "max_tokens": int(os.getenv("DEEPSEEK_MAX_TOKENS", "256")),
                    "temperature": float(os.getenv("DEEPSEEK_TEMPERATURE", "0.4")),
                }
            }
        
        # 加载GLM配置
        if os.getenv("GLM_API_KEY"):
            api_configs["glm"] = {
                "base_url": os.getenv("GLM_BASE_URL", "http://127.0.0.1:8000/v1/"),
                "api_key": os.getenv("GLM_API_KEY", "EMPTY"),
                "model": os.getenv("GLM_MODEL", "chatglm3-6b"),
                "params": {
                    "max_tokens": int(os.getenv("GLM_MAX_TOKENS", "256")),
                    "temperature": float(os.getenv("GLM_TEMPERATURE", "0.4")),
                    "presence_penalty": float(os.getenv("GLM_PRESENCE_PENALTY", "1.2")),
                    "top_p": float(os.getenv("GLM_TOP_P", "0.8")),
                }
            }
        
        # 设置默认API
        default_api = os.getenv("DEFAULT_API", "deepseek")
        if default_api in api_configs:
            api_configs["default"] = default_api
        elif api_configs:
            # 如果指定的默认API不存在但有其他API，使用第一个API作为默认
            api_configs["default"] = list(api_configs.keys())[0]
        else:
            # 如果没有配置任何API，添加一个警告
            print("警告: 未配置任何API，请检查.env文件")
            api_configs["default"] = "none"
        
        return api_configs
    
    async def on_load(self):
        """插件加载时执行的操作"""
        # 从.env加载API配置
        self.api_configs = self.load_env_variables()
        
        # 初始化OpenAI客户端字典
        self.clients = {}
        for api_name, config in self.api_configs.items():
            if isinstance(config, dict) and "base_url" in config:
                try:
                    self.clients[api_name] = OpenAI(
                        api_key=config["api_key"],
                        base_url=config["base_url"]
                    )
                    print(f"成功初始化API客户端: {api_name}")
                except Exception as e:
                    print(f"初始化API客户端失败 {api_name}: {str(e)}")
        
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        print(f"支持的API: {[k for k in self.clients.keys() if k != 'default']}")
        print(f"默认API: {self.api_configs.get('default', 'none')}")
    
    async def on_unload(self):
        """插件卸载时执行的操作"""
        print(f"{self.name} 插件已卸载")
    
    async def generate_response(self, content, api_name=None):
        """生成AI响应"""
        # 如果未指定API，使用默认API
        if not api_name:
            api_name = self.api_configs.get("default", "none")
        
        # 检查API是否存在
        if api_name == "none" or api_name not in self.clients:
            return f"错误: 未找到API '{api_name}'，请检查.env文件中的配置"
        
        # 获取API配置
        config = self.api_configs[api_name]
        client = self.clients[api_name]
        
        # 构建消息
        messages = [
            {
                "role": "system",
                "content": "你是一个有帮助的AI助手。请用中文回答用户的问题，保持回答有帮助且安全。"
            },
            {
                "role": "user",
                "content": content
            }
        ]
        
        try:
            # 准备API调用参数
            api_params = {
                "model": config["model"],
                "messages": messages,
                "stream": False,
            }
            
            # 添加其他参数
            if "params" in config:
                api_params.update(config["params"])
            
            # 调用API生成响应
            response = client.chat.completions.create(**api_params)
            
            if response and hasattr(response, 'choices') and response.choices:
                return response.choices[0].message.content
            else:
                return "对不起，我暂时无法回应，请稍后再试。"
        except Exception as e:
            print(f"API '{api_name}' 响应生成错误: {str(e)}")
            return f"使用 {api_name} API 时发生错误: {str(e)}"
    
    async def handle_chat_message(self, msg, content):
        """处理聊天消息"""
        # 检查是否指定了API
        api_name = None
        # 检查是否使用@指定API，格式为 @api_name 内容
        match = re.match(r'@(\w+)\s+(.*)', content)
        if match:
            api_name = match.group(1)
            content = match.group(2)
            
            # 检查API是否存在
            if api_name not in self.clients and api_name in self.api_configs:
                # 如果API配置存在但客户端不存在，尝试初始化
                config = self.api_configs[api_name]
                try:
                    self.clients[api_name] = OpenAI(
                        api_key=config["api_key"],
                        base_url=config["base_url"]
                    )
                    print(f"成功初始化API客户端: {api_name}")
                except Exception as e:
                    error_msg = f"初始化API客户端失败 {api_name}: {str(e)}"
                    print(error_msg)
                    await msg.reply(text=error_msg)
                    return
            elif api_name not in self.api_configs:
                message = MessageChain([Text(f"未找到API '{api_name}'，将使用默认API")])
                await msg.reply(rtf=message)
                api_name = self.api_configs.get("default", "none")
        
        try:
            # 生成AI响应
            response_text = await self.generate_response(content, api_name)
            
            # 回复消息
            if isinstance(msg, GroupMessage):
                # 在群聊中回复，包含@用户
                await self.api.post_group_msg(
                    group_id=msg.group_id, 
                    text=f"{response_text}", 
                    at=msg.sender.user_id
                )
            else:
                # 私聊直接回复
                await msg.reply(text=response_text)
                
        except Exception as e:
            error_msg = f"处理消息时出错: {str(e)}"
            print(error_msg)
            await msg.reply(text=error_msg)
    
    # 事件处理
    @bot.group_event()
    async def on_group_message(self, msg: GroupMessage):
        """处理群聊消息"""
        # 检查消息的第一个元素是否为@，并且@的是机器人
        is_at_me = False
        print(msg.message)
        # 检查 message 中是否包含 At 类型的元素，并且 target 是机器人的 QQ 号
        for seg in msg.message:
            if msg.message[0]["type"]=="at" and msg.message[0]["data"]["qq"]==str(msg.self_id):
                print("at me")
                is_at_me = True
                break
                
        if is_at_me:
            # 移除@信息获取实际内容
            content = re.sub(r'\[.*?\]', "", msg.raw_message).strip()
            print(content)
            for seg in msg.message:
                if isinstance(seg, At):
                    content = content.replace(f"@{seg.target} ", "").strip()
            
            # 检查内容是否为空
            if not content:
                message = MessageChain([
                    Text("[ERROR] 请输入内容")
                ])
                await msg.reply(rtf=message)
                return
                
            await self.handle_chat_message(msg, content)
    
    @bot.private_event()
    async def on_private_message(self, msg: PrivateMessage):
        """处理私聊消息"""
        # 私聊无需@，直接处理
        content = msg.raw_message
        
        # 检查内容是否为空
        if not content:
            message = MessageChain([
                Text("[ERROR] 请输入内容")
            ])
            await msg.reply(rtf=message)
            return
            
        # 处理私聊消息
        await self.handle_chat_message(msg, content)