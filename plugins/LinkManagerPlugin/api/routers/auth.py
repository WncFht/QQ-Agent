from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..dependencies.auth import create_access_token, get_current_user
from ..models.auth import LoginRequest, LoginResponse, User, Token

router = APIRouter()


@router.post("/login", response_model=LoginResponse, summary="用户登录")
async def login(login_data: LoginRequest):
    """
    用户登录接口
    
    - **user_id**: 用户ID
    - **username**: 用户名
    - **avatar**: 头像URL（可选）
    
    该API接受用户信息并返回访问令牌，用于后续的API请求认证。
    """
    # 创建访问令牌
    access_token = create_access_token(
        user_id=login_data.user_id,
        username=login_data.username
    )
    
    # 创建用户对象
    user = User(
        id=login_data.user_id,
        username=login_data.username,
        avatar=login_data.avatar
    )
    
    # 返回登录响应
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@router.post("/token", response_model=Token, summary="获取访问令牌")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2兼容的令牌获取接口
    
    该接口符合OAuth2标准，用于与标准OAuth2客户端集成。
    """
    # 使用表单数据中的username作为user_id
    access_token = create_access_token(
        user_id=form_data.username,
        username=form_data.username
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer"
    )


@router.get("/me", response_model=User, summary="获取当前用户信息")
async def get_user_me(current_user: User = Depends(get_current_user)):
    """
    获取当前认证用户的信息
    
    需要提供有效的Bearer令牌才能访问。
    """
    return current_user
