from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from ..dependencies.manager import get_link_manager
from ..dependencies.auth import get_current_user, get_optional_user
from ..models.tag import TagListResponse, TagResponse
from ..models.link import LinkListResponse
from ..models.auth import User
from ...link_manager import LinkManager

router = APIRouter()


@router.get("", response_model=TagListResponse, summary="获取所有标签")
async def get_all_tags(
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    获取所有标签列表
    
    返回所有标签及其关联的链接数量。
    """
    result = await manager.get_all_tags()
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
    
    return result


@router.get("/{tag_name}/links", response_model=LinkListResponse, summary="获取标签下的链接")
async def get_tag_links(
    tag_name: str = Path(..., description="标签名称"),
    group_id: Optional[str] = Query(None, description="群组ID，用于筛选特定群组的链接"),
    limit: int = Query(10, description="返回结果数量限制", ge=1, le=100),
    offset: int = Query(0, description="结果偏移量，用于分页", ge=0),
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    获取特定标签下的链接列表
    """
    # 使用空查询和特定标签搜索
    result = await manager.search_links(
        query="",
        group_id=group_id,
        tags=[tag_name],
        limit=limit,
        offset=offset,
        optimize_query=False
    )
    
    # 调整返回结果格式以符合LinkListResponse
    return {
        "links": result.get("links", []),
        "total": result.get("total", 0),
        "limit": result.get("limit", limit),
        "offset": result.get("offset", offset)
    }
