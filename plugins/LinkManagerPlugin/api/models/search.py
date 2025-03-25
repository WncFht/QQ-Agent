from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from .link import LinkResponse


class SearchQuery(BaseModel):
    """搜索查询模型"""
    query: str = Field(..., min_length=1, description="搜索关键词")
    group_id: Optional[str] = Field(None, description="限制特定群组的ID")
    tags: Optional[List[str]] = Field(None, description="按标签筛选")
    limit: Optional[int] = Field(10, ge=1, le=100, description="结果数量限制")
    offset: Optional[int] = Field(0, ge=0, description="结果偏移量")
    optimize_query: Optional[bool] = Field(True, description="是否使用AI优化搜索查询")
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "Python 异步编程",
                "group_id": "123456",
                "tags": ["技术", "编程"],
                "limit": 10,
                "offset": 0,
                "optimize_query": True
            }
        }


class SearchResponse(BaseModel):
    """搜索结果响应模型"""
    links: List[LinkResponse]
    total: int
    limit: int
    offset: int
    query: str
    optimized_query: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "links": [
                    {
                        "id": 1,
                        "url": "https://example.com/article1",
                        "title": "Python异步编程指南",
                        "summary": "这是一篇关于Python异步编程的指南",
                        "sender_id": "user123",
                        "sender_name": "张三",
                        "group_id": "123456",
                        "created_at": "2023-03-01T12:30:45",
                        "updated_at": "2023-03-01T12:30:45",
                        "tags": [
                            {"id": 1, "name": "技术"},
                            {"id": 2, "name": "编程"},
                            {"id": 3, "name": "Python"},
                            {"id": 4, "name": "异步"}
                        ]
                    }
                ],
                "total": 1,
                "limit": 10,
                "offset": 0,
                "query": "Python 异步编程教程",
                "optimized_query": "Python 异步编程"
            }
        } 