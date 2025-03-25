import unittest
import asyncio
from unittest.mock import MagicMock, patch

import sys
import os
# 添加项目根目录到路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from fastapi.testclient import TestClient
from plugins.LinkManagerPlugin.api.main import app
from plugins.LinkManagerPlugin.link_manager import LinkManager


class TestLinkManagerAPI(unittest.TestCase):
    """测试链接管理器API接口"""
    
    def setUp(self):
        # 创建测试客户端
        self.client = TestClient(app)
        
        # 打补丁的上下文管理器
        self.link_manager_patcher = patch('plugins.LinkManagerPlugin.api.dependencies.manager.LinkManager')
        
        # 启动补丁
        self.mock_link_manager = self.link_manager_patcher.start()
        
        # 设置模拟的返回值
        self.mock_link_manager_instance = MagicMock()
        self.mock_link_manager.return_value = self.mock_link_manager_instance
        
    def tearDown(self):
        # 停止补丁
        self.link_manager_patcher.stop()
    
    def test_get_root(self):
        """测试根路径API"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
    
    def test_health_check(self):
        """测试健康检查API"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})
    
    def test_get_recent_links(self):
        """测试获取最近链接API"""
        # 设置模拟的返回值
        self.mock_link_manager_instance.get_recent_links.return_value = {
            "links": [
                {
                    "id": 1,
                    "url": "https://example.com",
                    "title": "示例网站",
                    "summary": "这是一个示例网站",
                    "sender_id": "123456",
                    "sender_name": "测试用户",
                    "group_id": "654321",
                    "created_at": "2023-03-01T12:00:00",
                    "updated_at": "2023-03-01T12:00:00",
                    "tags": [
                        {"id": 1, "name": "示例"}
                    ]
                }
            ],
            "total": 1,
            "limit": 10,
            "offset": 0
        }
        
        response = self.client.get("/api/links?days=7&limit=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["links"]), 1)
        self.assertEqual(data["total"], 1)
    
    def test_get_link_detail(self):
        """测试获取链接详情API"""
        # 设置模拟的返回值
        self.mock_link_manager_instance.get_link.return_value = {
            "id": 1,
            "url": "https://example.com",
            "title": "示例网站",
            "summary": "这是一个示例网站",
            "sender_id": "123456",
            "sender_name": "测试用户",
            "group_id": "654321",
            "created_at": "2023-03-01T12:00:00",
            "updated_at": "2023-03-01T12:00:00",
            "tags": [
                {"id": 1, "name": "示例"}
            ],
            "descriptions": []
        }
        
        response = self.client.get("/api/links/1")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], 1)
        self.assertEqual(data["url"], "https://example.com")
    
    def test_search_links(self):
        """测试搜索链接API"""
        # 设置模拟的返回值
        self.mock_link_manager_instance.search_links.return_value = {
            "links": [
                {
                    "id": 1,
                    "url": "https://example.com",
                    "title": "示例网站",
                    "summary": "这是一个示例网站",
                    "sender_id": "123456",
                    "sender_name": "测试用户",
                    "group_id": "654321",
                    "created_at": "2023-03-01T12:00:00",
                    "updated_at": "2023-03-01T12:00:00",
                    "tags": [
                        {"id": 1, "name": "示例"}
                    ]
                }
            ],
            "total": 1,
            "limit": 10,
            "offset": 0,
            "query": "示例",
            "optimized_query": "示例 网站"
        }
        
        response = self.client.get("/api/search?query=示例")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["links"]), 1)
        self.assertEqual(data["query"], "示例")
    
    def test_get_all_tags(self):
        """测试获取所有标签API"""
        # 设置模拟的返回值
        self.mock_link_manager_instance.get_all_tags.return_value = {
            "tags": [
                {"id": 1, "name": "示例", "link_count": 5},
                {"id": 2, "name": "网站", "link_count": 3}
            ]
        }
        
        response = self.client.get("/api/tags")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["tags"]), 2)
    
    def test_login(self):
        """测试登录API"""
        # 打补丁，模拟创建令牌的功能
        with patch('plugins.LinkManagerPlugin.api.routers.auth.create_access_token') as mock_create_token:
            mock_create_token.return_value = "mock-token"
            
            response = self.client.post(
                "/api/auth/login",
                json={
                    "user_id": "123456",
                    "username": "测试用户",
                    "avatar": "https://example.com/avatar.png"
                }
            )
            
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["access_token"], "mock-token")
            self.assertEqual(data["user"]["username"], "测试用户")


if __name__ == '__main__':
    unittest.main() 