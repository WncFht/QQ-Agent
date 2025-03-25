import os
from typing import Optional
from fastapi import Depends, HTTPException, status

from ...link_manager import LinkManager
from ...config import load_config

# 全局LinkManager实例
_link_manager: Optional[LinkManager] = None


def get_link_manager() -> LinkManager:
    """
    获取或创建LinkManager实例，用于依赖注入
    
    Returns:
        LinkManager实例
    """
    global _link_manager
    
    if _link_manager is None:
        # 加载配置
        config = load_config()
        
        # 获取数据库路径
        db_config = config.get('database', {})
        db_path = db_config.get('path')
        if not db_path:
            # 默认数据库路径
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path = os.path.join(base_dir, 'data', 'links.db')
        
        # 获取API密钥
        model_config = config.get('model', {})
        api_key = os.environ.get('API_KEY') or model_config.get('api_key')
        
        try:
            # 创建LinkManager实例
            _link_manager = LinkManager(db_path=db_path, api_key=api_key)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"无法初始化链接管理器: {str(e)}"
            )
    
    return _link_manager 