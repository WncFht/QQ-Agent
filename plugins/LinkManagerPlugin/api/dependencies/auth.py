import os
import time
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ...config import load_config
from ..models.auth import TokenPayload, User

# OAuth2密码流
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# 从配置中加载密钥
config = load_config()
auth_config = config.get('auth', {})
SECRET_KEY = auth_config.get('secret_key', "default_secret_key_please_change_in_production")
ALGORITHM = auth_config.get('algorithm', "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = auth_config.get('access_token_expire_minutes', 60 * 24)  # 1天


def create_access_token(user_id: str, username: str) -> str:
    """
    创建访问令牌
    
    Args:
        user_id: 用户ID
        username: 用户名
        
    Returns:
        JWT令牌字符串
    """
    # 设置过期时间
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 创建payload
    payload = {
        "sub": user_id,
        "exp": int(expire.timestamp()),
        "username": username
    }
    
    # 编码JWT
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    从令牌中获取当前用户
    
    Args:
        token: JWT令牌
        
    Returns:
        User对象
        
    Raises:
        HTTPException: 如果令牌无效或已过期
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 解码JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 提取用户信息
        user_id = payload.get("sub")
        username = payload.get("username")
        exp = payload.get("exp")
        
        if user_id is None or username is None:
            raise credentials_exception
        
        # 检查是否过期
        if exp is None or int(time.time()) > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="令牌已过期",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建用户对象
        return User(id=user_id, username=username)
        
    except jwt.PyJWTError:
        raise credentials_exception


def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[User]:
    """
    从令牌中获取当前用户，但不强制要求认证
    
    Args:
        token: JWT令牌，可选
        
    Returns:
        User对象，如果未认证则为None
    """
    if not token:
        return None
    
    try:
        return get_current_user(token)
    except HTTPException:
        return None
