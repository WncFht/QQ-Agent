import os
import json
from typing import Dict, Any, Optional


def get_default_config() -> Dict[str, Any]:
    """
    获取默认配置
    """
    return {
        "database": {
            "path": "data/links.db"
        },
        "llm_config": {
            "default_model": "chatglm3-6b",
            "models": {
                "chatglm3-6b": {
                    "base_url": "http://127.0.0.1:8000/v1/",
                    "api_key": "EMPTY",
                    "type": "openai"
                },
                "bart-large-cnn": {
                    "base_url": "http://127.0.0.1:8001/v1/",
                    "api_key": "EMPTY",
                    "type": "huggingface"
                }
            }
        },
        "api_server": {
            "host": "0.0.0.0",
            "port": 8000,
            "enable": True,
            "cors_origins": ["http://localhost:3000", "https://wncfht.fun"]
        },
        "frontend": {
            "dev_port": 3000,
            "build_dir": "frontend/.next"
        },
        "web_server": {
            "domain": "wncfht.fun",
            "use_ssl": True,
            "ssl_cert": "/path/to/cert.pem",
            "ssl_key": "/path/to/key.pem"
        },
        "link_extraction": {
            "url_regex": "https?://(?:[-\\w.]|(?:%[\\da-fA-F]{2}))+"
        },
        "commands": {
            "view_links": "/view_links",
            "add_link": "/add_link",
            "search_links": "/search"
        },
        "auth": {
            "secret_key": "your-secret-key-here",
            "algorithm": "HS256",
            "access_token_expire_minutes": 30
        },
        "auto_reply": True
    }


def load_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    加载配置文件，如果不存在则创建默认配置
    
    Args:
        config_path: 配置文件路径，如果为None则使用默认路径
        
    Returns:
        配置字典
    """
    if config_path is None:
        plugin_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(plugin_dir, "config.json")
    
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            print(f"配置已加载: {config_path}")
            return config
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"无法加载配置文件 {config_path}: {str(e)}")
        print("使用默认配置")
        config = get_default_config()
        save_config(config, config_path)
        return config


def save_config(config: Dict[str, Any], config_path: Optional[str] = None) -> bool:
    """
    保存配置到文件
    
    Args:
        config: 配置字典
        config_path: 配置文件路径，如果为None则使用默认路径
        
    Returns:
        是否保存成功
    """
    if config_path is None:
        plugin_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(plugin_dir, "config.json")
    
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        # 保存配置
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=4)
        
        print(f"配置已保存: {config_path}")
        return True
    except Exception as e:
        print(f"保存配置失败: {str(e)}")
        return False


def update_config(config: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    递归更新配置
    
    Args:
        config: 原配置字典
        updates: 更新的配置项
        
    Returns:
        更新后的配置字典
    """
    for key, value in updates.items():
        if isinstance(value, dict) and key in config and isinstance(config[key], dict):
            config[key] = update_config(config[key], value)
        else:
            config[key] = value
    return config
