import os
import json
import time
import schedule
import threading
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
from ncatbot.plugin import BasePlugin, CompatibleEnrollment
from ncatbot.core.message import GroupMessage
from ncatbot.core.element import MessageChain, Text

# 导入自定义 API 客户端
from .api_client import create_api_client, BaseAPIClient

bot = CompatibleEnrollment

class DailySummaryPlugin(BasePlugin):
    name = "DailySummaryPlugin"
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
                    "max_tokens": int(os.getenv("DEEPSEEK_MAX_TOKENS", "8192")),
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
                }
            }
        
        # 加载百度文心配置
        if os.getenv("BAIDU_API_KEY"):
            api_configs["baidu"] = {
                "base_url": os.getenv("BAIDU_BASE_URL", "https://qianfan.baidubce.com/v2"),
                "api_key": os.getenv("BAIDU_API_KEY"),
                "model": os.getenv("BAIDU_MODEL", "qwq-32b"),
                "min_interval": os.getenv("BAIDU_MIN_INTERVAL", "2.0"),  # 最小调用间隔（秒）
                "params": {
                    "max_tokens": int(os.getenv("BAIDU_MAX_TOKENS", "2048")),
                    "temperature": float(os.getenv("BAIDU_TEMPERATURE", "0.3")),
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
    
    def load_config(self) -> Dict:
        """加载配置文件"""
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"加载配置文件失败: {str(e)}")
                return self.get_default_config()
        else:
            default_config = self.get_default_config()
            try:
                with open(config_path, "w", encoding="utf-8") as f:
                    json.dump(default_config, f, indent=4, ensure_ascii=False)
            except Exception as e:
                print(f"保存默认配置文件失败: {str(e)}")
            return default_config
    
    def get_default_config(self) -> Dict:
        """获取默认配置"""
        return {
            "auto_summary_interval": 43200,  # 自动总结间隔，12小时（秒）
            "manual_summary_interval": 300,  # 手动总结间隔，5分钟（秒）
            "min_messages": 10,
            "trigger_keywords": ["总结"],
            "storage_path": "message_logs",  # 消息存储路径
            "save_interval": 300,  # 定期保存间隔（秒）
        }
    
    def load_summary_times(self) -> Dict[str, float]:
        """加载上次总结时间记录"""
        summary_times_path = os.path.join(os.path.dirname(__file__), "summary_times.json")
        if os.path.exists(summary_times_path):
            try:
                with open(summary_times_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # 确保键是字符串类型
                    return {str(k): float(v) for k, v in data.items()}
            except Exception as e:
                print(f"加载总结时间记录失败: {str(e)}")
                return {}
        return {}
    
    def save_summary_times(self):
        """保存总结时间记录"""
        summary_times_path = os.path.join(os.path.dirname(__file__), "summary_times.json")
        try:
            # 将 defaultdict 转换为普通字典
            summary_times_dict = {str(k): v for k, v in dict(self.last_summary_time).items()}
            
            # 先写入临时文件，然后重命名，避免写入过程中的中断导致文件损坏
            temp_path = f"{summary_times_path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(summary_times_dict, f, indent=4, ensure_ascii=False)
            
            # 如果在Windows上，可能需要先删除目标文件
            if os.path.exists(summary_times_path):
                os.remove(summary_times_path)
            
            os.rename(temp_path, summary_times_path)
            print(f"已保存总结时间记录，共 {len(summary_times_dict)} 个群组")
        except Exception as e:
            print(f"保存总结时间记录失败: {str(e)}")
    
    def periodic_save(self):
        """定期保存数据"""
        self.save_summary_times()
    
    async def on_load(self):
        """插件加载时执行的操作"""
        self.message_store = defaultdict(list)  # 存储群聊消息
        self.config = self.load_config()
        
        # 加载上次总结时间记录
        summary_times = self.load_summary_times()
        self.last_summary_time = defaultdict(float)
        for group_id, timestamp in summary_times.items():
            self.last_summary_time[group_id] = timestamp
        
        # 从.env加载API配置
        self.api_configs = self.load_env_variables()
        self.api_clients = {}
        
        # 创建消息存储目录
        self.storage_dir = os.path.join(os.path.dirname(__file__), self.config["storage_path"])
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # 初始化 API 客户端
        for api_name, config in self.api_configs.items():
            if isinstance(config, dict) and "base_url" in config:
                try:
                    self.api_clients[api_name] = create_api_client(api_name, config)
                    print(f"成功初始化API客户端: {api_name}")
                except Exception as e:
                    print(f"初始化API客户端失败 {api_name}: {str(e)}")
        
        # 设置定时任务，使用自动总结间隔
        auto_interval = self.config.get("auto_summary_interval", 43200)  # 默认12小时
        # 添加一个随机延迟，避免所有群组同时触发总结
        schedule.every(auto_interval).seconds.do(self.scheduled_summary)
        
        # 设置定期保存任务
        save_interval = self.config.get("save_interval", 300)  # 默认5分钟
        schedule.every(save_interval).seconds.do(self.periodic_save)
        
        # 启动定时任务线程
        self.scheduler_thread = threading.Thread(target=self.run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        print(f"{self.name} 插件已加载")
        print(f"插件版本: {self.version}")
        print(f"支持的API: {[k for k in self.api_clients.keys() if k != 'default']}")
        print(f"默认API: {self.api_configs.get('default', 'none')}")
        print(f"消息存储路径: {self.storage_dir}")
        print(f"已加载 {len(self.last_summary_time)} 个群的总结时间记录")
        print(f"自动总结间隔: {auto_interval}秒 ({auto_interval/3600}小时)")
        print(f"手动总结间隔: {self.config.get('manual_summary_interval', 300)}秒")
        print(f"数据将每 {save_interval} 秒自动保存一次")
        
        # 不再在启动时预加载消息，而是在需要时按需加载
        # 这样可以避免在启动时发送大量 API 请求
        print(f"消息将在需要时按需加载")
    
    def run_scheduler(self):
        """运行定时任务"""
        while True:
            try:
                schedule.run_pending()
                time.sleep(1)
            except Exception as e:
                print(f"定时任务执行出错: {str(e)}")
    
    async def on_unload(self):
        """插件卸载时执行的操作"""
        # 保存总结时间记录
        try:
            self.save_summary_times()
            print(f"{self.name} 插件已卸载，数据已保存")
        except Exception as e:
            print(f"{self.name} 插件卸载时保存数据失败: {str(e)}")
    
    async def store_message(self, msg: GroupMessage):
        """存储消息记录，包括发言人和时间"""
        group_id = msg.group_id
        user_id = msg.sender.user_id
        nickname = msg.sender.nickname
        message_content = msg.raw_message
        timestamp = int(time.time()) # 也许以后可以用 msg.time
        formatted_time = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
        
        # 创建消息记录对象
        message_record = {
            "user_id": user_id,
            "nickname": nickname,
            "content": message_content,
            "timestamp": timestamp,
            "formatted_time": formatted_time
        }
        
        # 添加到内存中的消息存储
        self.message_store[group_id].append(message_record)
        
        # 将消息写入到日志文件
        today = datetime.now().strftime('%Y-%m-%d')
        group_dir = os.path.join(self.storage_dir, str(group_id))
        os.makedirs(group_dir, exist_ok=True)
        
        log_file = os.path.join(group_dir, f"{today}.jsonl")
        
        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(message_record, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"存储消息时出错: {str(e)}")
    
    async def load_recent_messages(self, group_id: str, days: int = 1, after_timestamp: float = None) -> List[Dict]:
        """加载最近几天的消息记录
        
        Args:
            group_id: 群组ID
            days: 加载最近几天的消息
            after_timestamp: 只加载该时间戳之后的消息，如果为None则加载所有消息
        """
        messages = []
        group_dir = os.path.join(self.storage_dir, str(group_id))
        
        if not os.path.exists(group_dir):
            return messages
        
        # 获取最近几天的日期
        dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days)]
        
        for date in dates:
            log_file = os.path.join(group_dir, f"{date}.jsonl")
            if os.path.exists(log_file):
                try:
                    with open(log_file, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.strip():
                                msg = json.loads(line)
                                # 如果指定了时间戳，只加载该时间戳之后的消息
                                if after_timestamp is None or msg["timestamp"] > after_timestamp:
                                    messages.append(msg)
                except Exception as e:
                    print(f"加载消息记录时出错: {str(e)}")
        
        # 按时间戳排序
        messages.sort(key=lambda x: x["timestamp"])
        return messages

    async def filter_messages_after_last_summary(self, messages: List[Dict], group_id: str) -> List[Dict]:
        """过滤出上次总结之后的消息"""
        last_summary_time = self.last_summary_time[group_id]
        if last_summary_time == 0:
            return messages  # 如果没有上次总结时间，返回所有消息
        
        # 只保留上次总结之后的消息
        return [msg for msg in messages if msg["timestamp"] > last_summary_time]
    
    async def generate_summary(self, messages: List[Dict], group_id: str) -> str:
        """使用 LLM 生成消息总结"""
        api_name = self.api_configs.get("default", "none")
        if api_name == "none" or api_name not in self.api_clients:
            return "LLM 服务未正确初始化，无法生成总结。请检查 .env 文件中的 API 配置。"
        
        try:
            # 构建提示词，包含发言人和时间信息
            formatted_messages = []
            for msg in messages:
                formatted_messages.append(f"[{msg['formatted_time']}] {msg['nickname']}({msg['user_id']}): {msg['content']}")
            
            prompt = f"""请对以下编程技术讨论群的消息进行总结：

{'\\n'.join(formatted_messages)}

请以讨论主题为基础，简洁地总结以下内容，按时间段列出讨论主题和主要内容：
1. 各个讨论主题的主要内容
2. 特别重要的链接或资源名称
3. 主要的讨论成员（提到一两个主要成员即可）

总结应当客观、全面，突出重点内容，忽略无意义的闲聊。单个主题在 100 字以内。
"""
            
            # 获取 API 客户端
            api_client = self.api_clients[api_name]
            
            # 使用 API 客户端生成总结
            return await api_client.generate_summary(prompt)
                
        except Exception as e:
            print(f"生成总结时出错: {str(e)}")
            return f"生成总结时发生错误: {str(e)}"
    
    async def check_summary_conditions(self, group_id: str, is_manual: bool = False) -> Tuple[bool, str]:
        """检查是否满足生成总结的条件
        
        Args:
            group_id: 群组ID
            is_manual: 是否为手动触发的总结
        """
        current_time = time.time()
        last_time = self.last_summary_time[group_id]
        
        # 根据是否手动触发选择不同的时间间隔
        if is_manual:
            interval = self.config.get("manual_summary_interval", 300)  # 默认5分钟
        else:
            interval = self.config.get("auto_summary_interval", 43200)  # 默认12小时
        
        # 检查时间间隔
        if current_time - last_time < interval:
            remaining = int(interval - (current_time - last_time))
            if is_manual:
                return False, f"距离上次总结时间太短，请等待 {remaining} 秒后再试"
            else:
                return False, f"距离上次自动总结时间太短，还需 {remaining} 秒"
        
        # 过滤出上次总结之后的消息
        messages = await self.filter_messages_after_last_summary(self.message_store[group_id], group_id)
        
        # 检查消息数量
        if len(messages) < self.config["min_messages"]:
            # 尝试从文件加载更多消息
            recent_messages = await self.load_recent_messages(group_id, days=7, after_timestamp=last_time)
            if len(recent_messages) < self.config["min_messages"]:
                return False, f"自上次总结后消息数量不足 {self.config['min_messages']} 条，无法生成总结"
        
        return True, ""
    
    async def send_summary(self, group_id: str, summary: str):
        """发送总结到群聊"""
        try:
            await self.api.post_group_msg(
                group_id=group_id,
                text=f"📊 群聊总结\n\n{summary}"
            )
            # 更新总结时间
            self.last_summary_time[group_id] = time.time()
            # 尝试保存，但不要让异常影响主流程
            try:
                self.save_summary_times()
            except Exception as e:
                print(f"发送总结后保存时间记录失败: {str(e)}")
        except Exception as e:
            print(f"发送总结时出错: {str(e)}")
            # 即使发送失败，也要更新时间并保存，避免反复尝试失败的总结
            self.last_summary_time[group_id] = time.time()
            try:
                self.save_summary_times()
            except Exception as e2:
                print(f"发送总结失败后保存时间记录失败: {str(e2)}")
    
    async def scheduled_summary(self):
        """定时任务：为所有群生成总结"""
        # 获取所有需要处理的群组 ID
        group_ids = list(self.message_store.keys())
        
        # 如果没有群组，直接返回
        if not group_ids:
            return
            
        for group_id in group_ids:
            # 检查是否满足生成总结的条件
            can_summarize, error_msg = await self.check_summary_conditions(group_id, is_manual=False)
            if can_summarize:
                # 过滤出上次总结之后的消息
                messages = await self.filter_messages_after_last_summary(self.message_store[group_id], group_id)
                
                # 如果内存中的消息不足，尝试从文件加载
                if len(messages) < self.config["min_messages"]:
                    last_time = self.last_summary_time[group_id]
                    recent_messages = await self.load_recent_messages(group_id, days=7, after_timestamp=last_time)
                    if len(recent_messages) >= self.config["min_messages"]:
                        messages = recent_messages
                    else:
                        # 消息不足，跳过此群组
                        continue
                
                # 生成总结并发送
                summary = await self.generate_summary(messages, group_id)
                await self.send_summary(group_id, summary)
                
                # 清空内存中的消息以节省内存
                self.message_store[group_id] = []
                
                # 添加延迟，避免频繁调用 API 触发限流
                await asyncio.sleep(5)  # 每个群组之间添加 5 秒延迟
                
    @bot.group_event()
    async def on_group_message(self, msg: GroupMessage):
        """处理群聊消息"""
        # 存储消息，包含发言人和时间信息
        await self.store_message(msg)
        
        # 检查是否是触发关键词
        if msg.raw_message in self.config["trigger_keywords"]:
            # 检查是否满足生成总结的条件
            can_summarize, error_msg = await self.check_summary_conditions(msg.group_id, is_manual=True)
            if can_summarize:
                # 过滤出上次总结之后的消息
                messages = await self.filter_messages_after_last_summary(self.message_store[msg.group_id], msg.group_id)
                
                # 如果内存中的消息不足，尝试从文件加载
                if len(messages) < self.config["min_messages"]:
                    last_time = self.last_summary_time[msg.group_id]
                    recent_messages = await self.load_recent_messages(msg.group_id, days=7, after_timestamp=last_time)
                    if len(recent_messages) >= self.config["min_messages"]:
                        messages = recent_messages
                    else:
                        await msg.reply(text=f"自上次总结后消息数量不足 {self.config['min_messages']} 条，无法生成总结")
                        return
                
                # 生成总结并发送
                summary = await self.generate_summary(messages, msg.group_id)
                await self.send_summary(msg.group_id, summary)
                
                # 清空内存中的消息
                self.message_store[msg.group_id] = []
            else:
                await msg.reply(text=error_msg)

    async def preload_recent_messages(self, group_id: str):
        """预加载群组的最近消息（现在仅在需要时调用）"""
        try:
            # 获取上次总结时间
            last_time = self.last_summary_time[group_id]
            if last_time > 0:
                # 加载上次总结后的消息
                recent_messages = await self.load_recent_messages(group_id, days=7, after_timestamp=last_time)
                if recent_messages:
                    self.message_store[group_id] = recent_messages
                    print(f"已为群组 {group_id} 预加载 {len(recent_messages)} 条消息记录")
        except Exception as e:
            print(f"预加载群组 {group_id} 的消息记录时出错: {str(e)}") 