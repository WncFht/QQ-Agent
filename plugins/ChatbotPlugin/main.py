import os
import json
import time
from typing import Dict, List, Optional
import re

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

def read_json(filepath):
    """读取JSON文件"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_json(filepath, data):
    """写入JSON文件"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

class ChatbotPlugin(BasePlugin):
    name = "ChatbotPlugin"
    version = "1.0.0"
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.config = {
            "history_file": "data/chatbot_history.json",
            "model": "chatglm3-6b",  # 或其他支持的模型
            "base_url": "http://127.0.0.1:8000/v1/",  # 本地API地址
            "api_key": "EMPTY",  # 本地部署时可使用空值
            "max_tokens": 256,
            "temperature": 0.4,
            "presence_penalty": 1.2,
            "top_p": 0.8,
            "max_history": 10  # 记忆的最大消息数
        }
        
        # 存储活跃对话
        self.active_conversations = {}  # 格式: {user_id: [messages]}
        
        # 确保数据目录存在
        os.makedirs(os.path.dirname(self.config["history_file"]), exist_ok=True)
        
        # 初始化OpenAI客户端
        self.client = OpenAI(
            api_key=self.config["api_key"],
            base_url=self.config["base_url"]
        )
        
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        print(f"使用模型: {self.config['model']}")
    
    async def on_unload(self):
        """插件卸载时执行的操作"""
        # 保存所有活跃对话
        for user_id, messages in self.active_conversations.items():
            self.save_conversation(user_id, messages)
        print(f"{self.name} 插件已卸载")
    
    def read_history(self, user_id):
        """读取特定用户的历史对话"""
        try:
            with open(self.config["history_file"], encoding="utf-8", mode="r") as f:
                all_history = json.loads(f.read())
                return all_history.get(str(user_id), [])
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def save_conversation(self, user_id, messages):
        """保存特定用户的对话"""
        try:
            with open(self.config["history_file"], encoding="utf-8", mode="r") as f:
                all_history = json.loads(f.read())
        except (FileNotFoundError, json.JSONDecodeError):
            all_history = {}
        
        # 更新用户历史记录
        all_history[str(user_id)] = messages
        
        with open(self.config["history_file"], encoding="utf-8", mode="w") as f:
            f.write(json.dumps(all_history, ensure_ascii=False, indent=4))
    
    async def generate_response(self, messages):
        """生成AI响应"""
        try:
            response = self.client.chat.completions.create(
                model=self.config["model"],
                messages=messages,
                max_tokens=self.config["max_tokens"],
                temperature=self.config["temperature"],
                presence_penalty=self.config["presence_penalty"],
                top_p=self.config["top_p"],
                stream=False,
            )
            
            if response and hasattr(response, 'choices') and response.choices:
                return response.choices[0].message.content
            else:
                return "对不起，我暂时无法回应，请稍后再试。"
        except Exception as e:
            print(f"AI响应生成错误: {e}")
            return f"发生错误: {str(e)}"
    
    def start_conversation(self, user_id, username):
        """开始新对话"""
        # 系统指令
        system_message = {
            "role": "system",
            "content": "你是一个友好的AI助手，能够回答用户的问题并保持对话连贯。请保持回复简洁、有礼貌且有帮助性。"
        }
        
        # 初始化对话
        self.active_conversations[user_id] = [system_message]
        
        return "你好！我是AI助手。有什么我可以帮助你的吗？"
    
    def end_conversation(self, user_id):
        """结束对话并保存历史"""
        if user_id in self.active_conversations:
            self.save_conversation(user_id, self.active_conversations[user_id])
            del self.active_conversations[user_id]
            return "对话已结束。感谢您的交流！"
        return "没有进行中的对话。"
    
    def clear_conversation(self, user_id):
        """清除对话"""
        if user_id in self.active_conversations:
            del self.active_conversations[user_id]
            return "对话已清除。"
        return "没有进行中的对话。"
    
    def help_conversation(self, user_id):
        """帮助对话"""
        return "请输入start开始对话，输入end结束对话，输入clear清除对话"
    
    def add_message(self, user_id, role, content):
        """添加消息到对话历史"""
        if user_id not in self.active_conversations:
            # 如果没有活跃对话，尝试从历史记录恢复
            self.active_conversations[user_id] = self.read_history(user_id)
            if not self.active_conversations[user_id]:
                # 如果没有历史记录，初始化新对话
                system_message = {
                    "role": "system",
                    "content": "你是一个友好的AI助手，能够回答用户的问题并保持对话连贯。请保持回复简洁、有礼貌且有帮助性。"
                }
                self.active_conversations[user_id] = [system_message]
        
        # 添加新消息
        self.active_conversations[user_id].append({
            "role": role,
            "content": content
        })
        
        # 限制历史长度，保留系统消息和最近的对话
        if len(self.active_conversations[user_id]) > self.config["max_history"] + 1:
            # 保留系统消息
            system_msg = self.active_conversations[user_id][0]
            # 保留最近的消息
            recent_msgs = self.active_conversations[user_id][-(self.config["max_history"]):]
            self.active_conversations[user_id] = [system_msg] + recent_msgs
    
    async def handle_chat_message(self, msg, content):
        """处理聊天消息"""
        user_id = msg.sender.user_id
        username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
        
        # 处理命令
        if content.lower() == "start":
            print("start")
            response_text = self.start_conversation(user_id, username)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        elif content.lower() == "end":
            print("end")
            response_text = self.end_conversation(user_id)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        elif content.lower() == "clear":
            print("clear")
            response_text = self.clear_conversation(user_id)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        elif content.lower() == "help":
            print("help")
            response_text = self.help_conversation(user_id)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        else:
            print("else")
            # 准备存储目录
            os.makedirs("./logs", exist_ok=True)
            
            # 检查是否存在历史对话记录
            history_path = f"./logs/{user_id}.json"
            history = read_json(history_path)
            
            # 添加用户消息
            history.append({"role": "user", "content": content})
            print(history)
            try:
                # 生成 AI 响应
                response_text = await self.generate_response(history)
                
                # 添加 AI 响应到历史记录
                history.append({"role": "assistant", "content": response_text})
                
                # 回复消息，包含@用户
                await self.api.post_group_msg(
                    group_id=msg.group_id, 
                    text=f"{response_text}", 
                    at=user_id
                )
                
                # 保存历史记录
                write_json(history_path, history)
                    
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
        user_id = msg.sender.user_id
        username = msg.sender.nickname if hasattr(msg.sender, 'nickname') else "未知用户"
        
        # 处理命令
        if content.lower() == "start":
            response_text = self.start_conversation(user_id, username)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        elif content.lower() == "end":
            response_text = self.end_conversation(user_id)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        elif content.lower() == "clear":
            response_text = self.clear_conversation(user_id)
            message = MessageChain([Text(response_text)])
            await msg.reply(rtf=message)
        else:
            # 准备存储目录
            os.makedirs("./logs", exist_ok=True)
            
            # 读取历史对话
            history_path = f"./logs/{user_id}.json"
            history = read_json(history_path)
            
            # 添加用户消息
            history.append({"role": "user", "content": content})
            
            try:
                # 生成 AI 响应
                response_text = await self.generate_response(history)
                
                # 添加 AI 响应到历史记录
                history.append({"role": "assistant", "content": response_text})
                
                # 回复消息
                await msg.reply(text=response_text)
                
                # 保存历史记录
                write_json(history_path, history)
                    
            except Exception as e:
                error_msg = f"处理消息时出错: {str(e)}"
                print(error_msg)
                await msg.reply(text=error_msg)