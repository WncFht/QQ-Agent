import os
import re
import json
import asyncio
from typing import Dict, List, Any, Optional, Tuple, Set, Union
from urllib.parse import urlparse
import httpx
from datetime import datetime

from .database import Database
from .api_client import ApiClient
from .config import load_config


class LinkManager:
    """链接管理核心类"""
    
    def __init__(self, db_path: Optional[str] = None, api_key: Optional[str] = None):
        """
        初始化链接管理器
        
        Args:
            db_path: 数据库文件路径，默认从配置文件加载
            api_key: API密钥，默认从配置文件或环境变量加载
        """
        # 加载配置
        self.config = load_config()
        
        # 初始化数据库
        db_config = self.config.get('database', {})
        db_path = db_path or db_config.get('path')
        if not db_path:
            # 默认数据库路径
            base_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(base_dir, 'data', 'links.db')
        
        # 确保数据库目录存在
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.db = Database(db_path)
        
        # 初始化API客户端
        self.api_client = ApiClient(api_key=api_key)
        
        # 编译URL正则表达式
        self.url_pattern = re.compile(self.config.get('url_pattern', r'https?://[^\s]+'))
    
    async def extract_urls(self, text: str) -> List[str]:
        """
        从文本中提取URL
        
        Args:
            text: 输入文本
            
        Returns:
            提取到的URL列表
        """
        urls = self.url_pattern.findall(text)
        # 清理URL（移除可能的尾部标点符号）
        cleaned_urls = []
        for url in urls:
            # 如果URL以某些标点符号结尾，去除这些符号
            url = re.sub(r'[,.!?;:"\')]$', '', url)
            # 确保URL有效
            if self._is_valid_url(url):
                cleaned_urls.append(url)
        return cleaned_urls
    
    def _is_valid_url(self, url: str) -> bool:
        """
        检查URL是否有效
        
        Args:
            url: 要检查的URL
            
        Returns:
            URL是否有效
        """
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
    
    async def add_link(self, url: str, sender_id: str, sender_name: str, 
                     group_id: Optional[str] = None, description: Optional[str] = None, 
                     fetch_metadata: bool = True) -> Dict[str, Any]:
        """
        添加链接
        
        Args:
            url: 链接URL
            sender_id: 发送者ID
            sender_name: 发送者名称
            group_id: 群组ID，如果是私聊则为None
            description: 链接描述，可选
            fetch_metadata: 是否获取链接元数据（标题、摘要等）
            
        Returns:
            包含链接信息的字典
        """
        # 检查URL是否有效
        if not self._is_valid_url(url):
            return {"error": "无效的URL格式"}
        
        metadata = {}
        if fetch_metadata:
            # 获取链接元数据
            try:
                metadata = await self._fetch_link_metadata(url)
            except Exception as e:
                print(f"获取链接元数据失败: {str(e)}")
                # 失败时使用空元数据继续
                metadata = {"title": None, "summary": None, "tags": []}
        
        # 添加到数据库
        link_id = await self.db.add_link(
            url=url,
            sender_id=sender_id,
            sender_name=sender_name,
            group_id=group_id,
            title=metadata.get("title"),
            summary=metadata.get("summary"),
            tags=metadata.get("tags"),
            description=description
        )
        
        # 获取完整链接信息
        link = await self.db.get_link(link_id)
        
        return link
    
    async def _fetch_link_metadata(self, url: str) -> Dict[str, Any]:
        """
        获取链接元数据
        
        Args:
            url: 链接URL
            
        Returns:
            包含标题、摘要和标签的字典
        """
        # 默认元数据
        metadata = {
            "title": None,
            "summary": None,
            "tags": []
        }
        
        try:
            # 尝试获取网页内容
            timeout = httpx.Timeout(15.0)  # 设置超时时间
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                # 提取标题
                title_match = re.search(r'<title>(.*?)</title>', response.text, re.IGNORECASE | re.DOTALL)
                if title_match:
                    metadata["title"] = title_match.group(1).strip()
                
                # 提取描述（可能用于摘要）
                description_match = re.search(r'<meta[^>]*name=["|\']description["|\'][^>]*content=["|\']([^"|\']*)["|\'][^>]*>', 
                                            response.text, re.IGNORECASE)
                if description_match:
                    metadata["summary"] = description_match.group(1).strip()
                
                # 使用API分析链接
                api_result = await self.api_client.analyze_link(
                    url=url,
                    title=metadata["title"],
                    content=response.text[:5000]  # 限制内容长度
                )
                
                # 更新元数据
                if "error" not in api_result:
                    if not metadata["summary"] and "summary" in api_result:
                        metadata["summary"] = api_result["summary"]
                    if "tags" in api_result and api_result["tags"]:
                        metadata["tags"] = api_result["tags"]
                
        except (httpx.HTTPError, asyncio.TimeoutError) as e:
            print(f"获取网页内容失败: {str(e)}")
            # 只使用API分析URL
            api_result = await self.api_client.analyze_link(url=url)
            if "error" not in api_result:
                metadata["summary"] = api_result.get("summary")
                metadata["tags"] = api_result.get("tags", [])
        
        return metadata
    
    async def get_recent_links(self, days: int = 7, group_id: Optional[str] = None, 
                              limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        """
        获取最近添加的链接
        
        Args:
            days: 获取最近几天的链接，默认7天
            group_id: 群组ID，如果提供则只获取该群组的链接
            limit: 返回结果数量限制，默认10
            offset: 结果偏移量，用于分页，默认0
            
        Returns:
            包含链接列表和总数的字典
        """
        links, total = await self.db.get_recent_links(days, group_id, limit, offset)
        return {
            "links": links,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    
    async def search_links(self, query: str, group_id: Optional[str] = None, 
                          tags: Optional[List[str]] = None, limit: int = 10, 
                          offset: int = 0, optimize_query: bool = True) -> Dict[str, Any]:
        """
        搜索链接
        
        Args:
            query: 搜索关键词
            group_id: 群组ID，如果提供则只搜索该群组的链接
            tags: 标签列表，如果提供则只搜索包含这些标签的链接
            limit: 返回结果数量限制，默认10
            offset: 结果偏移量，用于分页，默认0
            optimize_query: 是否使用API优化搜索查询
            
        Returns:
            包含链接列表和总数的字典
        """
        search_query = query
        
        # 使用API优化搜索查询
        if optimize_query and query:
            try:
                optimized_query = await self.api_client.generate_search_query(query)
                if optimized_query:
                    search_query = optimized_query
            except Exception as e:
                print(f"优化搜索查询失败: {str(e)}")
        
        links, total = await self.db.search_links(search_query, group_id, tags, limit, offset)
        
        return {
            "links": links,
            "total": total,
            "limit": limit,
            "offset": offset,
            "query": query,
            "optimized_query": search_query if search_query != query else None
        }
    
    async def get_link(self, link_id: int) -> Optional[Dict[str, Any]]:
        """
        获取链接详情
        
        Args:
            link_id: 链接ID
            
        Returns:
            链接详情字典，如果不存在则返回None
        """
        return await self.db.get_link(link_id)
    
    async def add_description(self, link_id: int, content: str, user_id: str, username: str) -> Dict[str, Any]:
        """
        为链接添加描述
        
        Args:
            link_id: 链接ID
            content: 描述内容
            user_id: 用户ID
            username: 用户名
            
        Returns:
            添加结果字典
        """
        try:
            # 检查链接是否存在
            link = await self.db.get_link(link_id)
            if not link:
                return {"error": f"链接ID {link_id} 不存在"}
            
            # 添加描述
            desc_id = await self.db.add_description(link_id, content, user_id, username)
            
            # 获取更新后的链接信息
            updated_link = await self.db.get_link(link_id)
            
            return {
                "success": True,
                "description_id": desc_id,
                "link": updated_link
            }
            
        except Exception as e:
            return {"error": f"添加描述失败: {str(e)}"}
    
    async def get_related_links(self, link_id: int, limit: int = 5) -> Dict[str, Any]:
        """
        获取相关链接
        
        Args:
            link_id: 链接ID
            limit: 返回结果数量限制，默认5
            
        Returns:
            包含相关链接的字典
        """
        try:
            # 获取链接详情
            link = await self.db.get_link(link_id)
            if not link:
                return {"error": f"链接ID {link_id} 不存在"}
            
            # 提取标签
            tags = [tag["name"] for tag in link.get("tags", [])]
            
            if not tags:
                # 如果没有标签，返回最近的链接
                recent_links, _ = await self.db.get_recent_links(limit=limit)
                # 排除当前链接
                related_links = [l for l in recent_links if l["id"] != link_id][:limit]
                return {
                    "related_links": related_links, 
                    "method": "recent"
                }
            
            # 首先基于标签搜索
            tag_links, total = await self.db.search_links("", None, tags, limit=20)
            # 排除当前链接
            tag_links = [l for l in tag_links if l["id"] != link_id]
            
            if len(tag_links) >= limit:
                # 如果基于标签找到足够的链接，直接返回
                return {
                    "related_links": tag_links[:limit], 
                    "method": "tags"
                }
            
            # 否则，使用API推荐相关链接
            # 获取更多的最近链接
            recent_links, _ = await self.db.get_recent_links(limit=50)
            # 排除当前链接
            recent_links = [l for l in recent_links if l["id"] != link_id]
            
            if not recent_links:
                # 如果没有其他链接，返回空列表
                return {"related_links": [], "method": "none"}
            
            # 使用API推荐相关链接
            api_recommended = await self.api_client.recommend_related_links(link, recent_links)
            
            # 合并结果（先添加基于标签的，再添加API推荐的）
            seen_ids = set(l["id"] for l in tag_links)
            combined_links = tag_links.copy()
            
            for rec_link in api_recommended:
                if rec_link["id"] not in seen_ids and len(combined_links) < limit:
                    combined_links.append(rec_link)
                    seen_ids.add(rec_link["id"])
            
            # 如果还不够，添加一些最近的链接
            if len(combined_links) < limit:
                for recent in recent_links:
                    if recent["id"] not in seen_ids and len(combined_links) < limit:
                        combined_links.append(recent)
                        seen_ids.add(recent["id"])
            
            return {
                "related_links": combined_links[:limit],
                "method": "hybrid"
            }
            
        except Exception as e:
            return {"error": f"获取相关链接失败: {str(e)}"}
    
    async def get_all_tags(self) -> Dict[str, Any]:
        """
        获取所有标签列表
        
        Returns:
            包含标签列表的字典
        """
        try:
            tags = await self.db.get_all_tags()
            return {"tags": tags}
        except Exception as e:
            return {"error": f"获取标签列表失败: {str(e)}"}
    
    async def process_message(self, message: str, sender_id: str, sender_name: str, 
                            group_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        处理消息，自动提取和保存链接
        
        Args:
            message: 消息内容
            sender_id: 发送者ID
            sender_name: 发送者名称
            group_id: 群组ID，如果是私聊则为None
            
        Returns:
            如果提取并保存了链接，则返回链接信息；否则返回None
        """
        # 提取URL
        urls = await self.extract_urls(message)
        if not urls:
            return None
        
        # 处理第一个URL
        url = urls[0]
        result = await self.add_link(
            url=url,
            sender_id=sender_id,
            sender_name=sender_name,
            group_id=group_id
        )
        
        # 如果有多个URL，后台处理其余URL
        if len(urls) > 1:
            asyncio.create_task(
                self._process_additional_urls(urls[1:], sender_id, sender_name, group_id)
            )
        
        return result
    
    async def _process_additional_urls(self, urls: List[str], sender_id: str, 
                                     sender_name: str, group_id: Optional[str] = None):
        """
        在后台处理额外的URL
        
        Args:
            urls: URL列表
            sender_id: 发送者ID
            sender_name: 发送者名称
            group_id: 群组ID，如果是私聊则为None
        """
        for url in urls:
            try:
                await self.add_link(
                    url=url,
                    sender_id=sender_id,
                    sender_name=sender_name,
                    group_id=group_id
                )
            except Exception as e:
                print(f"处理额外URL失败: {url} - {str(e)}")
                # 继续处理其他URL
