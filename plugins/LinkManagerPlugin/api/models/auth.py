from typing import Optional
from pydantic import BaseModel, Field


class User(BaseModel):
    """用户模型"""
    id: str
    username: str
    avatar: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123456",
                "username": "张三",
                "avatar": "https://example.com/avatar.png"
            }
        }


class TokenPayload(BaseModel):
    """JWT Token负载"""
    sub: str = Field(..., description="用户ID")
    exp: int = Field(..., description="过期时间戳")
    username: str = Field(..., description="用户名")
    
    class Config:
        json_schema_extra = {
            "example": {
                "sub": "123456",
                "exp": 1678012800,
                "username": "张三"
            }
        }


class Token(BaseModel):
    """访问令牌模型"""
    access_token: str
    token_type: str = "bearer"
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }


class LoginRequest(BaseModel):
    """登录请求模型"""
    user_id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    avatar: Optional[str] = Field(None, description="头像URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123456",
                "username": "张三",
                "avatar": "https://example.com/avatar.png"
            }
        }
        

class LoginResponse(BaseModel):
    """登录响应模型"""
    access_token: str
    token_type: str
    user: User
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123456",
                    "username": "张三",
                    "avatar": "https://example.com/avatar.png"
                }
            }
        } 