from typing import Dict, List, Any, Optional
import os
import time
import asyncio
from openai import OpenAI

class BaseAPIClient:
    """API 客户端基类"""
    
    def __init__(self, config: Dict[str, Any]):
        """初始化 API 客户端
        
        Args:
            config: API 配置信息
        """
        self.config = config
        self.client = None
        self.initialize_client()
    
    def initialize_client(self):
        """初始化客户端，子类需要实现此方法"""
        raise NotImplementedError("子类必须实现 initialize_client 方法")
    
    async def generate_summary(self, prompt: str) -> str:
        """生成摘要，子类需要实现此方法
        
        Args:
            prompt: 提示词
            
        Returns:
            生成的摘要文本
        """
        raise NotImplementedError("子类必须实现 generate_summary 方法")


class OpenAIBaseClient(BaseAPIClient):
    """基于 OpenAI 兼容接口的客户端基类"""
    
    def initialize_client(self):
        """初始化 OpenAI 客户端"""
        try:
            self.client = OpenAI(
                api_key=self.config.get("api_key"),
                base_url=self.config.get("base_url")
            )
            print(f"成功初始化 {self.__class__.__name__} 客户端")
        except Exception as e:
            print(f"初始化 {self.__class__.__name__} 客户端失败: {str(e)}")
            self.client = None
    
    async def generate_summary(self, prompt: str) -> str:
        """使用 OpenAI 兼容接口生成摘要
        
        Args:
            prompt: 提示词
            
        Returns:
            生成的摘要文本
        """
        if not self.client:
            return "API 客户端未正确初始化，无法生成总结"
        
        try:
            # 准备 API 调用参数
            api_params = {
                "model": self.config.get("model"),
                "messages": [
                    {"role": "system", "content": "你是一个专业的群聊总结助手，善于提取重要信息并做出简洁的总结。"},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
            }
            
            # 添加其他参数
            if "params" in self.config:
                api_params.update(self.config.get("params", {}))
            
            # 调用 API 生成响应
            response = self.client.chat.completions.create(**api_params)
            
            if response and hasattr(response, 'choices') and response.choices:
                return response.choices[0].message.content
            else:
                return "对不起，我暂时无法生成总结，请稍后再试。"
                
        except Exception as e:
            print(f"生成总结时出错: {str(e)}")
            return f"生成总结时发生错误: {str(e)}"


class DeepSeekClient(OpenAIBaseClient):
    """DeepSeek API 客户端"""
    pass


class GLMClient(OpenAIBaseClient):
    """GLM API 客户端"""
    pass


class BaiduClient(OpenAIBaseClient):
    """百度文心 API 客户端"""
    
    # 类级别变量，用于跟踪最近的 API 调用时间
    _last_api_call_time = 0
    _min_interval = 2.0  # 默认最小调用间隔（秒）
    
    def initialize_client(self):
        """初始化百度文心 API 客户端，并设置速率限制参数"""
        super().initialize_client()
        
        # 从配置中获取最小调用间隔
        if "min_interval" in self.config:
            BaiduClient._min_interval = float(self.config["min_interval"])
            print(f"百度 API 最小调用间隔设置为 {BaiduClient._min_interval} 秒")
    
    async def generate_summary(self, prompt: str) -> str:
        """使用百度文心 API 生成摘要，添加速率限制控制
        
        Args:
            prompt: 提示词
            
        Returns:
            生成的摘要文本
        """
        if not self.client:
            return "API 客户端未正确初始化，无法生成总结"
        
        try:
            # 检查是否需要等待以避免触发速率限制
            current_time = time.time()
            elapsed = current_time - BaiduClient._last_api_call_time
            
            if elapsed < BaiduClient._min_interval:
                # 需要等待一段时间
                wait_time = BaiduClient._min_interval - elapsed
                print(f"等待 {wait_time:.2f} 秒以避免百度 API 速率限制...")
                await asyncio.sleep(wait_time)
            
            # 更新最后调用时间
            BaiduClient._last_api_call_time = time.time()
            
            # 准备 API 调用参数
            api_params = {
                "model": self.config.get("model"),
                "messages": [
                    {"role": "system", "content": "你是一个专业的群聊总结助手，善于提取重要信息并做出简洁的总结。"},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
            }
            
            # 添加其他参数
            if "params" in self.config:
                api_params.update(self.config.get("params", {}))
            
            # 调用 API 生成响应
            response = self.client.chat.completions.create(**api_params)
            
            if response and hasattr(response, 'choices') and response.choices:
                return response.choices[0].message.content
            else:
                return "对不起，我暂时无法生成总结，请稍后再试。"
                
        except Exception as e:
            error_msg = str(e)
            print(f"生成总结时出错: {error_msg}")
            
            # 检查是否是速率限制错误
            if "rate_limit" in error_msg.lower():
                # 增加等待时间
                BaiduClient._min_interval += 1.0
                print(f"检测到速率限制，已将最小调用间隔增加到 {BaiduClient._min_interval} 秒")
                return "百度 API 触发了速率限制，请稍后再试。"
            
            return f"生成总结时发生错误: {error_msg}"


def create_api_client(api_name: str, config: Dict[str, Any]) -> Optional[BaseAPIClient]:
    """创建 API 客户端
    
    Args:
        api_name: API 名称
        config: API 配置信息
        
    Returns:
        API 客户端实例
    """
    client_map = {
        "deepseek": DeepSeekClient,
        "glm": GLMClient,
        "baidu": BaiduClient
    }
    
    if api_name in client_map:
        return client_map[api_name](config)
    else:
        print(f"未知的 API 类型: {api_name}")
        return None