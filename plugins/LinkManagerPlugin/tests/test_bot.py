import unittest
import asyncio
from unittest.mock import MagicMock, patch

import sys
import os
# 添加项目根目录到路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from plugins.LinkManagerPlugin.main import LinkManagerPlugin
from plugins.LinkManagerPlugin.database import Database


class MockMessage:
    """模拟QQ消息"""
    def __init__(self, raw_message, user_id="123456", group_id="654321", sender_name="测试用户"):
        self.raw_message = raw_message
        self.user_id = user_id
        self.group_id = group_id
        self.sender = {"user_id": user_id, "nickname": sender_name}


class MockAPI:
    """模拟QQ机器人API"""
    def __init__(self):
        self.group_messages = []
        self.private_messages = []
    
    async def post_group_msg(self, group_id, rtf):
        self.group_messages.append((group_id, rtf))
        return {"message_id": "mock-msg-id"}
    
    async def post_private_msg(self, user_id, rtf):
        self.private_messages.append((user_id, rtf))
        return {"message_id": "mock-msg-id"}


class TestLinkManagerBot(unittest.TestCase):
    """测试LinkManagerPlugin的QQ机器人功能"""
    
    def setUp(self):
        # 创建临时数据库
        self.db_path = ":memory:"  # 使用内存数据库进行测试
        
        # 模拟配置
        self.config = {
            "database": {"path": self.db_path},
            "commands": {
                "add_link": "/add_link",
                "view_links": "/view_links",
                "search_links": "/search"
            },
            "link_extraction": {"url_regex": "https?://(?:[-\\w.]|(?:%[\\da-fA-F]{2}))+"},
            "auto_reply": True
        }
        
        # 打补丁的上下文管理器
        self.db_patcher = patch('plugins.LinkManagerPlugin.main.Database')
        self.config_patcher = patch('plugins.LinkManagerPlugin.main.load_config')
        
        # 启动补丁
        self.mock_db = self.db_patcher.start()
        self.mock_load_config = self.config_patcher.start()
        
        # 设置模拟的返回值
        self.mock_load_config.return_value = self.config
        self.mock_db_instance = MagicMock()
        self.mock_db.return_value = self.mock_db_instance
        
        # 创建插件实例
        self.plugin = LinkManagerPlugin()
        self.plugin.api = MockAPI()
        
        # 运行事件循环
        self.loop = asyncio.get_event_loop()
        
    def tearDown(self):
        # 停止补丁
        self.db_patcher.stop()
        self.config_patcher.stop()
        
    def test_add_link_command(self):
        # 设置模拟的返回值：成功添加链接
        self.mock_db_instance.add_link.return_value = 1  # 返回链接ID 1
        
        # 创建模拟消息
        msg = MockMessage("/add_link https://example.com 示例网站")
        
        # 测试处理消息
        self.loop.run_until_complete(self.plugin.handle_add_link_command(msg))
        
        # 验证数据库方法被调用
        self.mock_db_instance.add_link.assert_called_once()
        args = self.mock_db_instance.add_link.call_args[0]
        self.assertEqual(args[0], "https://example.com")  # URL
        self.assertEqual(args[1], "123456")  # sender_id
        self.assertEqual(args[2], "测试用户")  # sender_name
        self.assertEqual(args[3], "654321")  # group_id
        
        # 验证回复消息
        self.assertEqual(len(self.plugin.api.group_messages), 1)
        
    def test_view_links_command(self):
        # 设置模拟的返回值：返回链接列表
        mock_links = [
            {
                "id": 1,
                "url": "https://example.com",
                "title": "示例网站",
                "summary": "这是一个示例网站",
                "tags": ["示例", "网站"],
                "sender_name": "测试用户",
                "created_at": "2023-03-01T12:00:00"
            }
        ]
        self.mock_db_instance.get_recent_links.return_value = (mock_links, 1)
        
        # 创建模拟消息
        msg = MockMessage("/view_links 7")
        
        # 测试处理消息
        self.loop.run_until_complete(self.plugin.handle_view_links_command(msg))
        
        # 验证数据库方法被调用
        self.mock_db_instance.get_recent_links.assert_called_once()
        
        # 验证回复消息
        self.assertEqual(len(self.plugin.api.group_messages), 1)
    
    def test_search_command(self):
        # 设置模拟的返回值：返回搜索结果
        mock_results = [
            {
                "id": 1,
                "url": "https://example.com",
                "title": "示例网站",
                "summary": "这是一个示例网站",
                "tags": ["示例", "网站"],
                "sender_name": "测试用户",
                "created_at": "2023-03-01T12:00:00"
            }
        ]
        self.mock_db_instance.search_links.return_value = (mock_results, 1)
        
        # 创建模拟消息
        msg = MockMessage("/search 示例 #网站")
        
        # 测试处理消息
        self.loop.run_until_complete(self.plugin.handle_search_command(msg))
        
        # 验证数据库方法被调用
        self.mock_db_instance.search_links.assert_called_once()
        
        # 验证回复消息
        self.assertEqual(len(self.plugin.api.group_messages), 1)
    
    def test_help_command(self):
        # 创建模拟消息
        msg = MockMessage("/help")
        
        # 测试处理消息
        self.loop.run_until_complete(self.plugin.handle_help_command(msg))
        
        # 验证回复消息
        self.assertEqual(len(self.plugin.api.group_messages), 1)
    
    def test_auto_extract_link(self):
        # 设置模拟的返回值
        self.mock_db_instance.add_link.return_value = 1  # 返回链接ID 1
        
        # 创建模拟消息，包含链接
        msg = MockMessage("大家看看这个网站 https://example.com 很有用")
        
        # 测试处理消息
        self.loop.run_until_complete(self.plugin.process_message(msg))
        
        # 验证数据库方法被调用
        self.mock_db_instance.add_link.assert_called_once()


if __name__ == '__main__':
    unittest.main() 