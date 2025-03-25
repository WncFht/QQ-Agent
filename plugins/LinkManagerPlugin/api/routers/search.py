from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status

from ..dependencies.manager import get_link_manager
from ..dependencies.auth import get_current_user, get_optional_user
from ..models.search import SearchQuery, SearchResponse
from ..models.auth import User
from ...link_manager import LinkManager

router = APIRouter()


@router.get("", response_model=SearchResponse, summary="搜索链接")
async def search_links(
    query: str = Query(..., min_length=1, description="搜索关键词"),
    group_id: Optional[str] = Query(None, description="群组ID，用于筛选特定群组的链接"),
    tags: Optional[List[str]] = Query(None, description="标签列表，用于按标签筛选"),
    limit: int = Query(10, description="返回结果数量限制", ge=1, le=100),
    offset: int = Query(0, description="结果偏移量，用于分页", ge=0),
    optimize_query: bool = Query(True, description="是否使用AI优化搜索查询"),
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    搜索链接
    
    可以通过关键词、群组ID和标签进行搜索。
    系统会自动尝试优化搜索查询以提高查询质量。
    """
    result = await manager.search_links(
        query=query,
        group_id=group_id,
        tags=tags,
        limit=limit,
        offset=offset,
        optimize_query=optimize_query
    )
    
    return result


@router.post("", response_model=SearchResponse, summary="高级搜索")
async def advanced_search(
    search_data: SearchQuery,
    manager: LinkManager = Depends(get_link_manager),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    高级搜索接口
    
    通过POST请求提交搜索参数，支持更复杂的搜索条件。
    
    - **query**: 搜索关键词
    - **group_id**: 群组ID（可选）
    - **tags**: 标签列表（可选）
    - **limit**: 返回结果数量限制（可选，默认10）
    - **offset**: 结果偏移量（可选，默认0）
    - **optimize_query**: 是否使用AI优化搜索查询（可选，默认True）
    """
    result = await manager.search_links(
        query=search_data.query,
        group_id=search_data.group_id,
        tags=search_data.tags,
        limit=search_data.limit,
        offset=search_data.offset,
        optimize_query=search_data.optimize_query
    )
    
    return result 