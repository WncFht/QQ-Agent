from typing import List, Optional
from pydantic import BaseModel, Field


class TagBase(BaseModel):
    """标签基础模型"""
    name: str = Field(..., min_length=1, max_length=50)


class TagCreate(TagBase):
    """创建标签请求模型"""
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "技术"
            }
        }


class TagResponse(TagBase):
    """标签响应模型"""
    id: int
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "技术"
            }
        }


class TagWithCount(TagResponse):
    """带链接计数的标签模型"""
    link_count: int
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "技术",
                "link_count": 15
            }
        }


class TagListResponse(BaseModel):
    """标签列表响应模型"""
    tags: List[TagWithCount]
    
    class Config:
        json_schema_extra = {
            "example": {
                "tags": [
                    {
                        "id": 1,
                        "name": "技术",
                        "link_count": 15
                    },
                    {
                        "id": 2,
                        "name": "编程",
                        "link_count": 10
                    },
                    {
                        "id": 3,
                        "name": "Python",
                        "link_count": 8
                    }
                ]
            }
        } 