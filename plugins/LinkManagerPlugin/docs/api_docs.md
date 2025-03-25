# 链接管理器 API 文档

本文档描述了链接管理器提供的REST API接口。所有API路径都以`/api`为前缀。

## 基础信息

- **基础URL**: `https://your-domain.com/api`
- **API版本**: v1
- **内容类型**: `application/json`

## 认证

部分API需要认证，使用Bearer令牌进行认证：

```
Authorization: Bearer <access_token>
```

获取令牌的方法见[登录接口](#认证相关)。

## API端点

### 链接相关

#### 获取最近链接

```
GET /links
```

**参数**:
- `days` (整数, 可选): 获取最近几天的链接，默认7天
- `group_id` (字符串, 可选): 筛选特定群组的链接
- `limit` (整数, 可选): 返回结果数量，默认10，最大100
- `offset` (整数, 可选): 结果偏移量，用于分页，默认0

**响应**:
```json
{
  "links": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "示例网站",
      "summary": "这是一个示例网站的摘要",
      "sender_id": "12345678",
      "sender_name": "张三",
      "group_id": "87654321",
      "created_at": "2023-03-01T12:30:45",
      "updated_at": "2023-03-01T12:30:45",
      "tags": [
        {"id": 1, "name": "示例"}
      ]
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### 获取链接详情

```
GET /links/{link_id}
```

**参数**:
- `link_id` (整数, 路径参数): 链接ID

**响应**:
```json
{
  "id": 1,
  "url": "https://example.com",
  "title": "示例网站",
  "summary": "这是一个示例网站的摘要",
  "sender_id": "12345678",
  "sender_name": "张三",
  "group_id": "87654321",
  "created_at": "2023-03-01T12:30:45",
  "updated_at": "2023-03-01T12:30:45",
  "tags": [
    {"id": 1, "name": "示例"}
  ],
  "descriptions": [
    {
      "id": 1,
      "content": "这是一个描述",
      "user_id": "12345678",
      "username": "张三",
      "created_at": "2023-03-01T12:35:10"
    }
  ]
}
```

#### 添加链接

```
POST /links
```

**请求体**:
```json
{
  "url": "https://example.com",
  "title": "示例网站",
  "summary": "这是一个网站摘要",
  "tags": ["示例", "网站"],
  "description": "这是我添加的描述",
  "group_id": "87654321"
}
```

**响应**: 返回创建的链接对象

#### 为链接添加描述

```
POST /links/{link_id}/descriptions
```

**请求体**:
```json
{
  "content": "这是一个新的描述"
}
```

**响应**:
```json
{
  "success": true,
  "description_id": 2,
  "link": {
    // 包含更新后的链接对象
  }
}
```

#### 获取相关链接

```
GET /links/{link_id}/related
```

**参数**:
- `link_id` (整数, 路径参数): 链接ID
- `limit` (整数, 可选): 返回结果数量，默认5，最大20

**响应**:
```json
{
  "related_links": [
    // 相关链接对象数组
  ],
  "method": "tag_based" // 推荐方法: tag_based, content_based, hybrid
}
```

### 搜索相关

#### 搜索链接

```
GET /search
```

**参数**:
- `query` (字符串): 搜索关键词
- `group_id` (字符串, 可选): 筛选特定群组的链接
- `tags` (字符串数组, 可选): 按标签筛选
- `limit` (整数, 可选): 返回结果数量，默认10，最大100
- `offset` (整数, 可选): 结果偏移量，用于分页，默认0
- `optimize_query` (布尔值, 可选): 是否使用AI优化查询，默认true

**响应**:
```json
{
  "links": [
    // 链接对象数组
  ],
  "total": 5,
  "limit": 10,
  "offset": 0,
  "query": "原始查询",
  "optimized_query": "优化后的查询"
}
```

#### 高级搜索

```
POST /search
```

**请求体**:
```json
{
  "query": "搜索关键词",
  "group_id": "87654321",
  "tags": ["标签1", "标签2"],
  "limit": 10,
  "offset": 0,
  "optimize_query": true
}
```

**响应**: 与GET搜索相同

### 标签相关

#### 获取所有标签

```
GET /tags
```

**响应**:
```json
{
  "tags": [
    {
      "id": 1,
      "name": "示例",
      "link_count": 5
    },
    {
      "id": 2,
      "name": "网站",
      "link_count": 3
    }
  ]
}
```

#### 获取标签下的链接

```
GET /tags/{tag_name}/links
```

**参数**:
- `tag_name` (字符串, 路径参数): 标签名称
- `group_id` (字符串, 可选): 筛选特定群组的链接
- `limit` (整数, 可选): 返回结果数量，默认10，最大100
- `offset` (整数, 可选): 结果偏移量，用于分页，默认0

**响应**: 与链接列表响应格式相同

### 认证相关

#### 用户登录

```
POST /auth/login
```

**请求体**:
```json
{
  "user_id": "12345678",
  "username": "张三",
  "avatar": "https://example.com/avatar.png"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "12345678",
    "username": "张三",
    "avatar": "https://example.com/avatar.png"
  }
}
```

#### 获取当前用户信息

```
GET /auth/me
```

**响应**:
```json
{
  "id": "12345678",
  "username": "张三",
  "avatar": "https://example.com/avatar.png"
}
```

## 错误处理

API使用标准HTTP状态码表示请求状态:

- 200: 请求成功
- 201: 资源创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

错误响应格式:

```json
{
  "message": "错误信息描述"
}
```

## 限速策略

API有请求频率限制，每IP每分钟最多100个请求。超过限制会返回429状态码。

## 示例代码

### JavaScript

```javascript
// 获取最近链接
async function getRecentLinks() {
  const response = await fetch('https://your-domain.com/api/links?days=30&limit=20');
  const data = await response.json();
  return data;
}

// 搜索链接
async function searchLinks(query) {
  const response = await fetch(`https://your-domain.com/api/search?query=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data;
}
```

### Python

```python
import requests

# 获取最近链接
def get_recent_links():
    response = requests.get('https://your-domain.com/api/links', params={
        'days': 30,
        'limit': 20
    })
    return response.json()

# 搜索链接
def search_links(query):
    response = requests.get('https://your-domain.com/api/search', params={
        'query': query
    })
    return response.json()
``` 