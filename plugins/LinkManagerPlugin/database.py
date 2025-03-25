import os
import json
import re
import time
import sqlite3
import asyncio
from typing import Dict, List, Tuple, Any, Optional, Union
from datetime import datetime, timedelta
from pathlib import Path


class Database:
    """数据库操作封装类"""
    
    def __init__(self, db_path: str):
        """
        初始化数据库
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        
        # 确保数据库目录存在
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # 初始化数据库表
        self._init_db()
    
    def _get_connection(self) -> sqlite3.Connection:
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使查询结果可以通过列名访问
        return conn
    
    def _init_db(self):
        """初始化数据库表结构"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # 创建链接表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                title TEXT,
                summary TEXT,
                sender_id TEXT NOT NULL,
                sender_name TEXT NOT NULL,
                group_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # 创建标签表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
            ''')
            
            # 创建链接-标签关系表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS link_tags (
                link_id INTEGER,
                tag_id INTEGER,
                PRIMARY KEY (link_id, tag_id),
                FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )
            ''')
            
            # 创建描述表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS descriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                link_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                user_id TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
            )
            ''')
            
            conn.commit()
        finally:
            conn.close()
    
    async def add_link(self, url: str, sender_id: str, sender_name: str, 
                      group_id: Optional[str] = None, title: Optional[str] = None, 
                      summary: Optional[str] = None, tags: Optional[List[str]] = None,
                      description: Optional[str] = None) -> int:
        """
        添加链接
        
        Args:
            url: 链接URL
            sender_id: 发送者ID
            sender_name: 发送者名称
            group_id: 群组ID，如果是私聊则为None
            title: 链接标题，默认为None
            summary: 链接摘要，默认为None
            tags: 链接标签列表，默认为None
            description: 链接描述，默认为None
            
        Returns:
            新添加的链接ID
        """
        # 异步执行数据库操作
        return await asyncio.to_thread(self._add_link_sync, url, sender_id, sender_name, 
                                       group_id, title, summary, tags, description)
    
    def _add_link_sync(self, url: str, sender_id: str, sender_name: str, 
                      group_id: Optional[str] = None, title: Optional[str] = None, 
                      summary: Optional[str] = None, tags: Optional[List[str]] = None,
                      description: Optional[str] = None) -> int:
        """同步版本的添加链接操作"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # 检查链接是否已存在
            cursor.execute('SELECT id FROM links WHERE url = ?', (url,))
            result = cursor.fetchone()
            
            # 如果链接已存在，返回已存在的链接ID
            if result:
                link_id = result['id']
                
                # 更新标题和摘要（如果提供了的话）
                if title or summary:
                    update_fields = []
                    params = []
                    
                    if title:
                        update_fields.append('title = ?')
                        params.append(title)
                    
                    if summary:
                        update_fields.append('summary = ?')
                        params.append(summary)
                    
                    update_fields.append('updated_at = CURRENT_TIMESTAMP')
                    
                    query = f"UPDATE links SET {', '.join(update_fields)} WHERE id = ?"
                    params.append(link_id)
                    
                    cursor.execute(query, params)
                
                # 如果提供了标签，更新标签
                if tags:
                    self._add_tags_to_link(conn, link_id, tags)
                
                # 如果提供了描述，添加描述
                if description:
                    cursor.execute(
                        'INSERT INTO descriptions (link_id, content, user_id, username) VALUES (?, ?, ?, ?)',
                        (link_id, description, sender_id, sender_name)
                    )
                
                conn.commit()
                return link_id
            
            # 添加新链接
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(
                'INSERT INTO links (url, title, summary, sender_id, sender_name, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                (url, title, summary, sender_id, sender_name, group_id, now, now)
            )
            
            link_id = cursor.lastrowid
            
            # 添加标签
            if tags:
                self._add_tags_to_link(conn, link_id, tags)
            
            # 添加描述
            if description:
                cursor.execute(
                    'INSERT INTO descriptions (link_id, content, user_id, username) VALUES (?, ?, ?, ?)',
                    (link_id, description, sender_id, sender_name)
                )
            
            conn.commit()
            return link_id
            
        finally:
            conn.close()
    
    def _add_tags_to_link(self, conn: sqlite3.Connection, link_id: int, tags: List[str]):
        """为链接添加标签"""
        cursor = conn.cursor()
        
        for tag_name in tags:
            # 先检查标签是否存在
            cursor.execute('SELECT id FROM tags WHERE name = ?', (tag_name,))
            result = cursor.fetchone()
            
            if result:
                tag_id = result['id']
            else:
                # 创建新标签
                cursor.execute('INSERT INTO tags (name) VALUES (?)', (tag_name,))
                tag_id = cursor.lastrowid
            
            # 添加链接-标签关系
            try:
                cursor.execute('INSERT INTO link_tags (link_id, tag_id) VALUES (?, ?)', (link_id, tag_id))
            except sqlite3.IntegrityError:
                # 如果关系已存在，则忽略
                pass
    
    async def get_link(self, link_id: int) -> Optional[Dict[str, Any]]:
        """
        获取链接详情
        
        Args:
            link_id: 链接ID
            
        Returns:
            链接详情字典，如果不存在则返回None
        """
        return await asyncio.to_thread(self._get_link_sync, link_id)
    
    def _get_link_sync(self, link_id: int) -> Optional[Dict[str, Any]]:
        """同步版本的获取链接详情操作"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # 查询链接基本信息
            cursor.execute('''
            SELECT id, url, title, summary, sender_id, sender_name, group_id, 
                   created_at, updated_at
            FROM links
            WHERE id = ?
            ''', (link_id,))
            
            link_row = cursor.fetchone()
            if not link_row:
                return None
            
            # 构建链接字典
            link = dict(link_row)
            
            # 查询标签
            cursor.execute('''
            SELECT t.id, t.name
            FROM tags t
            JOIN link_tags lt ON t.id = lt.tag_id
            WHERE lt.link_id = ?
            ''', (link_id,))
            
            link['tags'] = [dict(row) for row in cursor.fetchall()]
            
            # 查询描述
            cursor.execute('''
            SELECT id, content, user_id, username, created_at
            FROM descriptions
            WHERE link_id = ?
            ORDER BY created_at DESC
            ''', (link_id,))
            
            link['descriptions'] = [dict(row) for row in cursor.fetchall()]
            
            return link
            
        finally:
            conn.close()
    
    async def get_recent_links(self, days: int = 7, group_id: Optional[str] = None, 
                              limit: int = 10, offset: int = 0) -> Tuple[List[Dict[str, Any]], int]:
        """
        获取最近添加的链接
        
        Args:
            days: 获取最近几天的链接，默认7天
            group_id: 群组ID，如果提供则只获取该群组的链接
            limit: 返回结果数量限制，默认10
            offset: 结果偏移量，用于分页，默认0
            
        Returns:
            (链接列表, 总数量)
        """
        return await asyncio.to_thread(self._get_recent_links_sync, days, group_id, limit, offset)
    
    def _get_recent_links_sync(self, days: int = 7, group_id: Optional[str] = None, 
                              limit: int = 10, offset: int = 0) -> Tuple[List[Dict[str, Any]], int]:
        """同步版本的获取最近链接操作"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # 计算时间范围
            date_threshold = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
            
            # 构建查询条件
            conditions = ['created_at >= ?']
            params = [date_threshold]
            
            if group_id:
                conditions.append('group_id = ?')
                params.append(group_id)
            
            where_clause = ' AND '.join(conditions)
            
            # 查询总数
            count_query = f'SELECT COUNT(*) as count FROM links WHERE {where_clause}'
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()['count']
            
            # 查询链接列表
            links_query = f'''
            SELECT id, url, title, summary, sender_id, sender_name, created_at
            FROM links
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            '''
            
            cursor.execute(links_query, params + [limit, offset])
            links = []
            
            for row in cursor.fetchall():
                link = dict(row)
                
                # 查询标签
                cursor.execute('''
                SELECT t.name
                FROM tags t
                JOIN link_tags lt ON t.id = lt.tag_id
                WHERE lt.link_id = ?
                ''', (link['id'],))
                
                link['tags'] = [row['name'] for row in cursor.fetchall()]
                links.append(link)
            
            return links, total_count
            
        finally:
            conn.close()
    
    async def search_links(self, query: str, group_id: Optional[str] = None, 
                          tags: Optional[List[str]] = None, limit: int = 10, 
                          offset: int = 0) -> Tuple[List[Dict[str, Any]], int]:
        """
        搜索链接
        
        Args:
            query: 搜索关键词
            group_id: 群组ID，如果提供则只搜索该群组的链接
            tags: 标签列表，如果提供则只搜索包含这些标签的链接
            limit: 返回结果数量限制，默认10
            offset: 结果偏移量，用于分页，默认0
            
        Returns:
            (链接列表, 总数量)
        """
        return await asyncio.to_thread(self._search_links_sync, query, group_id, tags, limit, offset)
    
    def _search_links_sync(self, query: str, group_id: Optional[str] = None, 
                          tags: Optional[List[str]] = None, limit: int = 10, 
                          offset: int = 0) -> Tuple[List[Dict[str, Any]], int]:
        """同步版本的搜索链接操作"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # 构建基本查询条件
            conditions = []
            params = []
            
            # 关键词搜索条件
            if query:
                # 在URL、标题和摘要中搜索关键词
                search_terms = query.split()
                for term in search_terms:
                    like_term = f'%{term}%'
                    conditions.append('(url LIKE ? OR title LIKE ? OR summary LIKE ?)')
                    params.extend([like_term, like_term, like_term])
            
            # 群组条件
            if group_id:
                conditions.append('group_id = ?')
                params.append(group_id)
            
            # 构建基本WHERE子句
            base_where = '1=1'  # 默认条件，始终为真
            if conditions:
                base_where = ' AND '.join(conditions)
            
            # 获取链接ID
            link_ids_query = f'''
            SELECT DISTINCT l.id
            FROM links l
            '''
            
            # 如果需要按标签筛选，添加标签关联表
            if tags and len(tags) > 0:
                tag_placeholders = ', '.join(['?'] * len(tags))
                link_ids_query += f'''
                JOIN link_tags lt ON l.id = lt.link_id
                JOIN tags t ON lt.tag_id = t.id
                WHERE {base_where} AND t.name IN ({tag_placeholders})
                GROUP BY l.id
                HAVING COUNT(DISTINCT t.name) = ?
                '''
                params.extend(tags)
                params.append(len(tags))  # 确保链接包含所有指定标签
            else:
                link_ids_query += f'WHERE {base_where}'
            
            # 计算总数
            count_query = f'SELECT COUNT(*) as count FROM ({link_ids_query})'
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()['count']
            
            # 获取链接详情
            cursor.execute(f'{link_ids_query} ORDER BY l.created_at DESC LIMIT ? OFFSET ?', 
                        params + [limit, offset])
            link_ids = [row['id'] for row in cursor.fetchall()]
            
            links = []
            for link_id in link_ids:
                # 获取链接基本信息
                cursor.execute('''
                SELECT id, url, title, summary, sender_id, sender_name, created_at
                FROM links
                WHERE id = ?
                ''', (link_id,))
                
                link = dict(cursor.fetchone())
                
                # 获取标签
                cursor.execute('''
                SELECT t.name
                FROM tags t
                JOIN link_tags lt ON t.id = lt.tag_id
                WHERE lt.link_id = ?
                ''', (link_id,))
                
                link['tags'] = [row['name'] for row in cursor.fetchall()]
                links.append(link)
            
            return links, total_count
            
        finally:
            conn.close()
    
    async def add_description(self, link_id: int, content: str, user_id: str, username: str) -> int:
        """
        为链接添加描述
        
        Args:
            link_id: 链接ID
            content: 描述内容
            user_id: 用户ID
            username: 用户名
            
        Returns:
            新添加的描述ID
        """
        return await asyncio.to_thread(self._add_description_sync, link_id, content, user_id, username)
    
    def _add_description_sync(self, link_id: int, content: str, user_id: str, username: str) -> int:
        """同步版本的添加描述操作"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute(
                'INSERT INTO descriptions (link_id, content, user_id, username) VALUES (?, ?, ?, ?)',
                (link_id, content, user_id, username)
            )
            
            conn.commit()
            return cursor.lastrowid
            
        finally:
            conn.close()
    
    async def get_all_tags(self) -> List[Dict[str, Any]]:
        """
        获取所有标签列表
        
        Returns:
            标签列表
        """
        return await asyncio.to_thread(self._get_all_tags_sync)
    
    def _get_all_tags_sync(self) -> List[Dict[str, Any]]:
        """同步版本的获取所有标签操作"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT t.id, t.name, COUNT(lt.link_id) as link_count
            FROM tags t
            LEFT JOIN link_tags lt ON t.id = lt.tag_id
            GROUP BY t.id
            ORDER BY link_count DESC
            ''')
            
            return [dict(row) for row in cursor.fetchall()]
            
        finally:
            conn.close()
