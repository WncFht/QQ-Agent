from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl, validator


class Tag(BaseModel):
    """标签模型"""
    id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=50)
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "技术"
            }
        }


class Description(BaseModel):
    """链接描述模型"""
    id: Optional[int] = None
    content: str = Field(..., min_length=1)
    user_id: str
    username: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "content": "这是一个非常有用的技术文章，解释了如何实现异步编程。",
                "user_id": "12345",
                "username": "张三",
                "created_at": "2023-03-01T12:30:45"
            }
        }


class LinkBase(BaseModel):
    """链接基础模型"""
    url: HttpUrl
    title: Optional[str] = None
    summary: Optional[str] = None


class LinkCreate(LinkBase):
    """创建链接请求模型"""
    group_id: Optional[str] = None
    tags: Optional[List[str]] = []
    description: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com/article",
                "title": "示例文章标题",
                "summary": "这是一篇关于示例主题的文章",
                "group_id": "123456",
                "tags": ["技术", "编程", "Python"],
                "description": "这是一个非常有用的文章"
            }
        }


class LinkUpdate(BaseModel):
    """更新链接请求模型"""
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "更新后的标题",
                "summary": "更新后的摘要",
                "tags": ["技术", "编程", "更新"]
            }
        }


class LinkResponse(LinkBase):
    """链接响应模型"""
    id: int
    sender_id: str
    sender_name: str
    group_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: List[Tag] = []
    descriptions: Optional[List[Description]] = []
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "url": "https://example.com/article",
                "title": "示例文章标题",
                "summary": "这是一篇关于示例主题的文章",
                "sender_id": "user123",
                "sender_name": "张三",
                "group_id": "123456",
                "created_at": "2023-03-01T12:30:45",
                "updated_at": "2023-03-01T12:30:45",
                "tags": [
                    {"id": 1, "name": "技术"},
                    {"id": 2, "name": "编程"},
                    {"id": 3, "name": "Python"}
                ],
                "descriptions": [
                    {
                        "id": 1,
                        "content": "这是一个非常有用的技术文章。",
                        "user_id": "user123",
                        "username": "张三",
                        "created_at": "2023-03-01T12:30:45"
                    }
                ]
            }
        }


class LinkListResponse(BaseModel):
    """链接列表响应模型"""
    links: List[LinkResponse]
    total: int
    limit: int
    offset: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "links": [
                    {
                        "id": 1,
                        "url": "https://example.com/article1",
                        "title": "示例文章1",
                        "summary": "这是第一篇示例文章",
                        "sender_id": "user123",
                        "sender_name": "张三",
                        "group_id": "123456",
                        "created_at": "2023-03-01T12:30:45",
                        "updated_at": "2023-03-01T12:30:45",
                        "tags": [
                            {"id": 1, "name": "技术"},
                            {"id": 2, "name": "编程"}
                        ]
                    },
                    {
                        "id": 2,
                        "url": "https://example.com/article2",
                        "title": "示例文章2",
                        "summary": "这是第二篇示例文章",
                        "sender_id": "user456",
                        "sender_name": "李四",
                        "group_id": "123456",
                        "created_at": "2023-03-02T10:15:30",
                        "updated_at": "2023-03-02T10:15:30",
                        "tags": [
                            {"id": 1, "name": "技术"},
                            {"id": 3, "name": "Python"}
                        ]
                    }
                ],
                "total": 2,
                "limit": 10,
                "offset": 0
            }
        }


class RelatedLinkResponse(BaseModel):
    """相关链接响应模型"""
    related_links: List[LinkResponse]
    method: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "related_links": [
                    {
                        "id": 2,
                        "url": "https://example.com/related1",
                        "title": "相关文章1",
                        "summary": "这是一篇相关文章",
                        "sender_id": "user456",
                        "sender_name": "李四",
                        "group_id": "123456",
                        "created_at": "2023-03-02T10:15:30",
                        "updated_at": "2023-03-02T10:15:30",
                        "tags": [
                            {"id": 1, "name": "技术"},
                            {"id": 3, "name": "Python"}
                        ]
                    }
                ],
                "method": "tags"
            }
        }


class DescriptionCreate(BaseModel):
    """创建描述请求模型"""
    content: str = Field(..., min_length=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "这是对链接的附加描述"
            }
        }


class DescriptionResponse(BaseModel):
    """描述响应模型"""
    success: bool
    description_id: int
    link: LinkResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "description_id": 2,
                "link": {
                    "id": 1,
                    "url": "https://example.com/article",
                    "title": "示例文章标题",
                    "summary": "这是一篇关于示例主题的文章",
                    "sender_id": "user123",
                    "sender_name": "张三",
                    "group_id": "123456",
                    "created_at": "2023-03-01T12:30:45",
                    "updated_at": "2023-03-01T12:30:45",
                    "tags": [
                        {"id": 1, "name": "技术"}
                    ],
                    "descriptions": [
                        {
                            "id": 1,
                            "content": "原始描述",
                            "user_id": "user123",
                            "username": "张三",
                            "created_at": "2023-03-01T12:30:45"
                        },
                        {
                            "id": 2,
                            "content": "这是新添加的描述",
                            "user_id": "user456",
                            "username": "李四",
                            "created_at": "2023-03-02T14:20:10"
                        }
                    ]
                }
            }
        }
