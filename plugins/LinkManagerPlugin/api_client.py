import asyncio
import json
import os
from typing import Dict, List, Any, Optional, Union
import httpx
from .config import load_config


class ApiClient:
    """大语言模型API客户端"""
    
    def __init__(self, api_key: Optional[str] = None, api_base_url: Optional[str] = None, 
                model_name: Optional[str] = None):
        """
        初始化API客户端
        
        Args:
            api_key: API密钥，如果为None则从配置文件加载
            api_base_url: API基础URL，如果为None则从配置文件加载
            model_name: 模型名称，如果为None则从配置文件加载
        """
        # 加载配置
        config = load_config()
        self.model_config = config.get('model', {})
        
        # 设置API参数
        self.api_key = api_key or os.environ.get('API_KEY') or self.model_config.get('api_key')
        self.api_base_url = api_base_url or self.model_config.get('api_base_url', 'https://api.openai.com/v1')
        self.model_name = model_name or self.model_config.get('model_name', 'gpt-3.5-turbo')
        self.timeout = self.model_config.get('timeout', 60)
        
        if not self.api_key:
            raise ValueError("API密钥未提供，请在配置文件中设置或通过环境变量API_KEY提供")
        
        # 客户端设置
        self.client_kwargs = {
            'timeout': httpx.Timeout(self.timeout),
            'headers': {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
        }
    
    async def analyze_link(self, url: str, title: Optional[str] = None, 
                          content: Optional[str] = None) -> Dict[str, Any]:
        """
        分析链接，生成摘要和标签
        
        Args:
            url: 链接URL
            title: 链接标题，可选
            content: 链接内容，可选
            
        Returns:
            包含摘要和标签的字典
        """
        # 构建提示
        context = f"URL: {url}"
        if title:
            context += f"\n标题: {title}"
        if content:
            # 截取内容的一部分
            max_content_length = 2000  # 限制内容长度
            truncated_content = content[:max_content_length]
            if len(content) > max_content_length:
                truncated_content += "...(内容已截断)"
            context += f"\n内容: {truncated_content}"
        
        prompt = f"""
你是一个专业的Web内容分析助手。请根据以下提供的链接信息，生成一个简短的摘要（不超过100字）和5个相关标签。
标签应该是简短的关键词，能够准确反映链接内容的主题和类别。标签不应该包含空格。

{context}

请按照以下JSON格式输出结果：
{{
    "summary": "这是链接的简短摘要...",
    "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}}
        """
        
        # 调用API
        return await self._call_api(prompt)
    
    async def recommend_related_links(self, link_info: Dict[str, Any], 
                                     existing_links: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        推荐相关链接
        
        Args:
            link_info: 当前链接信息
            existing_links: 现有链接列表
            
        Returns:
            推荐链接列表
        """
        if not existing_links:
            return []
        
        # 构建链接列表字符串
        link_list = ""
        for i, link in enumerate(existing_links[:20]):  # 限制数量
            tags = ", ".join(link.get('tags', []))
            link_list += f"{i+1}. URL: {link['url']}\n   标题: {link.get('title', '无标题')}\n   标签: {tags}\n\n"
        
        # 构建当前链接信息
        current_link = f"URL: {link_info['url']}\n标题: {link_info.get('title', '无标题')}\n摘要: {link_info.get('summary', '无摘要')}\n标签: {', '.join(link_info.get('tags', []))}"
        
        prompt = f"""
你是一个推荐系统助手。请根据用户当前查看的链接，从下面的现有链接列表中选择3-5个最相关的链接进行推荐。
考虑标题相似性、标签匹配度以及内容相关性等因素。

当前链接:
{current_link}

现有链接列表:
{link_list}

请以JSON格式返回推荐链接的索引列表（从1开始）:
{{
    "recommended_indices": [索引1, 索引2, ...]
}}
        """
        
        # 调用API
        result = await self._call_api(prompt)
        
        # 处理结果
        indices = result.get("recommended_indices", [])
        recommended_links = []
        
        for idx in indices:
            try:
                # 索引从1开始，需要减1
                link_idx = idx - 1
                if 0 <= link_idx < len(existing_links):
                    recommended_links.append(existing_links[link_idx])
            except (ValueError, IndexError):
                continue
        
        return recommended_links
    
    async def generate_search_query(self, user_input: str) -> str:
        """
        从用户输入生成优化的搜索查询
        
        Args:
            user_input: 用户输入的搜索文本
            
        Returns:
            优化后的搜索查询
        """
        prompt = f"""
你是一个搜索优化助手。请将用户的输入转换为更有效的搜索查询，以便在链接管理系统中查找相关链接。
移除不必要的词语，保留关键词，确保查询简洁而有针对性。

用户输入:
{user_input}

请直接返回优化后的搜索查询，不要添加任何额外的解释或说明。
        """
        
        # 调用API
        result = await self._call_api(prompt, raw_response=True)
        
        # 清理结果，确保返回纯文本查询
        query = result.strip()
        # 移除可能的引号
        if (query.startswith('"') and query.endswith('"')) or (query.startswith("'") and query.endswith("'")):
            query = query[1:-1]
        
        return query
    
    async def _call_api(self, prompt: str, raw_response: bool = False) -> Union[Dict[str, Any], str]:
        """
        调用大语言模型API
        
        Args:
            prompt: 提示文本
            raw_response: 是否返回原始响应文本
            
        Returns:
            如果raw_response为True，则返回原始响应文本；否则尝试解析为JSON并返回字典
        """
        # 准备请求数据
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "你是一个专业的链接分析助手，善于分析网页内容并提供有价值的见解。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        try:
            async with httpx.AsyncClient(**self.client_kwargs) as client:
                response = await client.post(
                    f"{self.api_base_url}/chat/completions",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                # 提取模型输出的文本
                response_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                if raw_response:
                    return response_text
                
                # 尝试从文本中提取JSON
                try:
                    # 查找JSON内容
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}")
                    
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end+1]
                        return json.loads(json_str)
                    
                    # 如果没有找到JSON格式，返回文本作为摘要
                    return {"summary": response_text.strip(), "tags": []}
                    
                except json.JSONDecodeError:
                    # 如果解析JSON失败，返回文本作为摘要
                    return {"summary": response_text.strip(), "tags": []}
                    
        except httpx.HTTPStatusError as e:
            print(f"API请求失败: HTTP {e.response.status_code} - {e.response.text}")
            return {"error": f"API请求失败: {str(e)}"}
            
        except (httpx.RequestError, asyncio.TimeoutError) as e:
            print(f"API连接错误: {str(e)}")
            return {"error": f"API连接错误: {str(e)}"}
            
        except Exception as e:
            print(f"调用API时发生未知错误: {str(e)}")
            return {"error": f"未知错误: {str(e)}"}
