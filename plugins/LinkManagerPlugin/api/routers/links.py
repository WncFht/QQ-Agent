from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from ..dependencies.manager import get_link_manager
from ..dependencies.auth import get_current_user, get_optional_user
from ..models.link import (
    LinkCreate, LinkUpdate, LinkResponse, LinkListResponse,
    DescriptionCreate, DescriptionResponse, RelatedLinkResponse
)
from ..models.auth import User
from ...link_manager import LinkManager

router = APIRouter()


@router.post("", response_model=LinkResponse, status_code=status.HTTP_201_CREATED, summary="添加新链接")
async def create_link(
    link_data: LinkCreate,
    current_user: User = Depends(get_current_user),
    manager: LinkManager = Depends(get_link_manager)
):
    """
    添加新链接
    
    - **url**: 链接URL
    - **title**: 标题（可选）
    - **summary**: 摘要（可选）
    - **group_id**: 群组ID（可选）
    - **tags**: 标签列表（可选）
    - **description**: 链接描述（可选）
    
    如果未提供标题和摘要，系统将尝试从URL获取。
    """
    result = await manager.add_link(
        url=str(link_data.url),
        sender_id=current_user.id,
        sender_name=current_user.username,
        group_id=link_data.group_id,
        description=link_data.description,
        fetch_metadata=True if link_data.title is None or link_data.summary is None else False
    )
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    
    return result


@router.get("", response_model=LinkListResponse, summary="获取最近链接")
async def get_recent_links(
    days: int = Query(7, description="获取最近几天的链接", ge=1, le=90),
    group_id: Optional[str] = Query(None, description="群组ID，用于筛选特定群组的链接"),
    limit: int = Query(10, description="返回结果数量限制", ge=1, le=100),
    offset: int = Query(0, description="结果偏移量，用于分页", ge=0),
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    获取最近添加的链接列表
    
    可以指定天数、群组ID、结果数量和偏移量。
    """
    result = await manager.get_recent_links(days, group_id, limit, offset)
    return result


@router.get("/{link_id}", response_model=LinkResponse, summary="获取链接详情")
async def get_link(
    link_id: int = Path(..., description="链接ID", ge=1),
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    获取特定链接的详细信息
    
    包括标签和描述信息。
    """
    link = await manager.get_link(link_id)
    
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"链接ID {link_id} 不存在"
        )
    
    return link


@router.put("/{link_id}", response_model=LinkResponse, summary="更新链接信息")
async def update_link(
    link_data: LinkUpdate,
    link_id: int = Path(..., description="链接ID", ge=1),
    current_user: User = Depends(get_current_user),
    manager: LinkManager = Depends(get_link_manager)
):
    """
    更新链接信息
    
    可以更新标题、摘要和标签。
    """
    # 首先检查链接是否存在
    link = await manager.get_link(link_id)
    
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"链接ID {link_id} 不存在"
        )
    
    # 构建更新参数
    update_data = {k: v for k, v in link_data.dict().items() if v is not None}
    
    # TODO: 实现链接更新功能
    # 由于当前的LinkManager没有直接提供update_link方法
    # 这里需要扩展LinkManager类或添加更新逻辑
    
    # 临时解决方案：如果有更新，抛出未实现异常
    if update_data:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="链接更新功能尚未实现"
        )
    
    # 返回链接信息
    return link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除链接")
async def delete_link(
    link_id: int = Path(..., description="链接ID", ge=1),
    current_user: User = Depends(get_current_user),
    manager: LinkManager = Depends(get_link_manager)
):
    """
    删除特定链接
    
    需要管理员权限或链接的原始发布者才能删除。
    """
    # TODO: 实现链接删除功能
    # 由于当前的LinkManager没有直接提供delete_link方法
    
    # 临时解决方案：抛出未实现异常
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="链接删除功能尚未实现"
    )


@router.post("/{link_id}/descriptions", response_model=DescriptionResponse, summary="添加链接描述")
async def add_description(
    description_data: DescriptionCreate,
    link_id: int = Path(..., description="链接ID", ge=1),
    current_user: User = Depends(get_current_user),
    manager: LinkManager = Depends(get_link_manager)
):
    """
    为链接添加新的描述
    
    - **content**: 描述内容
    """
    result = await manager.add_description(
        link_id=link_id,
        content=description_data.content,
        user_id=current_user.id,
        username=current_user.username
    )
    
    if "error" in result:
        if "不存在" in result["error"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return result


@router.get("/{link_id}/related", response_model=RelatedLinkResponse, summary="获取相关链接")
async def get_related_links(
    link_id: int = Path(..., description="链接ID", ge=1),
    limit: int = Query(5, description="返回结果数量限制", ge=1, le=20),
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    获取与特定链接相关的链接列表
    
    基于标签匹配和内容相似性推荐。
    """
    result = await manager.get_related_links(link_id, limit)
    
    if "error" in result:
        if "不存在" in result["error"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
    
    return result
