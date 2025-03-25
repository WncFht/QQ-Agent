import os
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from openai import OpenAI

class APIClient:
    """API 客户端基类"""
    
    def __init__(self, api_config: Dict[str, Any]):
        self.api_config = api_config
        self.client = None
    
    async def initialize(self) -> bool:
        """初始化客户端"""
        raise NotImplementedError("子类必须实现 initialize 方法")
    
    async def generate_response(self, prompt: str) -> str:
        """生成响应"""
        raise NotImplementedError("子类必须实现 generate_response 方法")


class OpenAIClient(APIClient):
    """OpenAI API 客户端"""
    
    async def initialize(self) -> bool:
        """初始化 OpenAI 客户端"""
        try:
            self.client = OpenAI(
                api_key=self.api_config.get("api_key"),
                base_url=self.api_config.get("base_url", "https://api.openai.com/v1")
            )
            return True
        except Exception as e:
            print(f"初始化 OpenAI 客户端失败: {str(e)}")
            return False
    
    async def generate_response(self, prompt: str) -> str:
        """使用 OpenAI API 生成响应"""
        try:
            if not self.client:
                return "API 客户端未初始化"
            
            model = self.api_config.get("model", "gpt-3.5-turbo")
            max_tokens = self.api_config.get("max_tokens", 256)
            temperature = self.api_config.get("temperature", 0.7)
            
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "你是一个有用的助手。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            if response and hasattr(response, 'choices') and response.choices:
                return response.choices[0].message.content
            else:
                return "生成响应失败"
        except Exception as e:
            print(f"生成响应时出错: {str(e)}")
            return f"生成响应时发生错误: {str(e)}"


class BaiduClient(APIClient):
    """百度 API 客户端"""
    
    async def initialize(self) -> bool:
        """初始化百度 API 客户端"""
        try:
            self.client = OpenAI(
                base_url=self.api_config.get("base_url", "https://qianfan.baidubce.com/v2"),
                api_key=self.api_config.get("api_key")
            )
            return True
        except Exception as e:
            print(f"初始化百度 API 客户端失败: {str(e)}")
            return False
    
    async def generate_response(self, prompt: str) -> str:
        """使用百度 API 生成响应"""
        try:
            if not self.client:
                return "API 客户端未初始化"
            
            model = self.api_config.get("model", "qwq-32b")
            max_tokens = self.api_config.get("max_tokens", 256)
            temperature = self.api_config.get("temperature", 0.7)
            
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            if response and hasattr(response, 'choices') and response.choices:
                return response.choices[0].message.content
            else:
                return "生成响应失败"
        except Exception as e:
            print(f"生成响应时出错: {str(e)}")
            return f"生成响应时发生错误: {str(e)}"


def load_api_configs(env_path: str) -> Dict[str, Dict[str, Any]]:
    """从 .env 文件加载 API 配置"""
    # 加载 .env 文件
    load_dotenv(env_path)
    
    # 构建 API 配置
    api_configs = {}
    
    # 加载 OpenAI 配置
    if os.getenv("OPENAI_API_KEY"):
        api_configs["openai"] = {
            "base_url": os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "api_key": os.getenv("OPENAI_API_KEY"),
            "model": os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
            "max_tokens": int(os.getenv("OPENAI_MAX_TOKENS", "256")),
            "temperature": float(os.getenv("OPENAI_TEMPERATURE", "0.7")),
        }
    
    # 加载百度 API 配置
    if os.getenv("BAIDU_API_KEY"):
        api_configs["baidu"] = {
            "base_url": os.getenv("BAIDU_BASE_URL", "https://qianfan.baidubce.com/v2"),
            "api_key": os.getenv("BAIDU_API_KEY"),
            "model": os.getenv("BAIDU_MODEL", "qwq-32b"),
            "max_tokens": int(os.getenv("BAIDU_MAX_TOKENS", "256")),
            "temperature": float(os.getenv("BAIDU_TEMPERATURE", "0.7")),
        }
    
    # 设置默认 API
    default_api = os.getenv("DEFAULT_API", "openai")
    if default_api in api_configs:
        api_configs["default"] = default_api
    elif api_configs:
        # 如果指定的默认 API 不存在但有其他 API，使用第一个 API 作为默认
        api_configs["default"] = list(api_configs.keys())[0]
    else:
        # 如果没有配置任何 API，添加一个警告
        print("警告: 未配置任何 API，请检查 .env 文件")
        api_configs["default"] = "none"
    
    return api_configs


def create_api_client(api_name: str, api_configs: Dict[str, Dict[str, Any]]) -> Optional[APIClient]:
    """创建 API 客户端"""
    if api_name not in api_configs or api_name == "default" or api_name == "none":
        # 使用默认 API
        default_api = api_configs.get("default", "none")
        if default_api == "none" or default_api not in api_configs:
            return None
        api_name = default_api
    
    api_config = api_configs[api_name]
    
    if api_name == "openai":
        return OpenAIClient(api_config)
    elif api_name == "baidu":
        return BaiduClient(api_config)
    else:
        return None 