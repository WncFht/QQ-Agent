/**
 * 链接管理系统API客户端
 */

// API基础URL
const API_BASE_URL = '/api';

// API路径
const API_PATHS = {
  links: `${API_BASE_URL}/links`,
  tags: `${API_BASE_URL}/tags`,
  search: `${API_BASE_URL}/search`,
  auth: `${API_BASE_URL}/auth`
};

// 接口定义
export interface Tag {
  id: number;
  name: string;
  link_count?: number;
}

export interface Description {
  id: number;
  content: string;
  username: string;
  user_id: string;
  created_at: string;
}

export interface Link {
  id: number;
  url: string;
  title: string;
  summary: string;
  sender_id: string;
  sender_name: string;
  group_id?: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  descriptions?: Description[];
}

export interface LinkListResponse {
  links: Link[];
  total: number;
  limit: number;
  offset: number;
}

export interface TagListResponse {
  tags: (Tag & { link_count: number })[];
}

export interface SearchResponse extends LinkListResponse {
  query: string;
  optimized_query?: string;
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// API错误处理
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// 创建请求头
function createHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// 处理API响应
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = '请求失败';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // 忽略JSON解析错误
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  return await response.json() as T;
}

// API方法
export const api = {
  /**
   * 获取最近链接
   */
  async getRecentLinks(days: number = 7, group_id?: string, limit: number = 10, offset: number = 0): Promise<LinkListResponse> {
    const params = new URLSearchParams({
      days: days.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (group_id) {
      params.append('group_id', group_id);
    }
    
    const response = await fetch(`${API_PATHS.links}?${params.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return handleResponse<LinkListResponse>(response);
  },
  
  /**
   * 获取链接详情
   */
  async getLinkDetail(id: number): Promise<Link> {
    const response = await fetch(`${API_PATHS.links}/${id}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return handleResponse<Link>(response);
  },
  
  /**
   * 添加链接
   */
  async addLink(url: string, title?: string, summary?: string, tags?: string[], description?: string, group_id?: string): Promise<Link> {
    const response = await fetch(API_PATHS.links, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        url,
        title,
        summary,
        tags,
        description,
        group_id
      })
    });
    
    return handleResponse<Link>(response);
  },
  
  /**
   * 搜索链接
   */
  async searchLinks(query: string, tags?: string[], group_id?: string, limit: number = 10, offset: number = 0, optimize_query: boolean = true): Promise<SearchResponse> {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      offset: offset.toString(),
      optimize_query: optimize_query.toString()
    });
    
    if (group_id) {
      params.append('group_id', group_id);
    }
    
    if (tags && tags.length > 0) {
      tags.forEach(tag => params.append('tags', tag));
    }
    
    const response = await fetch(`${API_PATHS.search}?${params.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return handleResponse<SearchResponse>(response);
  },
  
  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<TagListResponse> {
    const response = await fetch(API_PATHS.tags, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return handleResponse<TagListResponse>(response);
  },
  
  /**
   * 获取标签下的链接
   */
  async getLinksByTag(tagName: string, group_id?: string, limit: number = 10, offset: number = 0): Promise<LinkListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (group_id) {
      params.append('group_id', group_id);
    }
    
    const response = await fetch(`${API_PATHS.tags}/${encodeURIComponent(tagName)}/links?${params.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return handleResponse<LinkListResponse>(response);
  },
  
  /**
   * 用户登录
   */
  async login(user_id: string, username: string, avatar?: string): Promise<LoginResponse> {
    const response = await fetch(`${API_PATHS.auth}/login`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({
        user_id,
        username,
        avatar
      })
    });
    
    const data = await handleResponse<LoginResponse>(response);
    
    // 保存token到本地存储
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    
    return data;
  },
  
  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User | null> {
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    try {
      const response = await fetch(`${API_PATHS.auth}/me`, {
        method: 'GET',
        headers: createHeaders()
      });
      
      if (!response.ok) {
        return null;
      }
      
      const user = await handleResponse<User>(response);
      localStorage.setItem('user_info', JSON.stringify(user));
      return user;
    } catch (error) {
      return null;
    }
  },
  
  /**
   * 退出登录
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  },
  
  /**
   * 添加链接描述
   */
  async addDescription(linkId: number, content: string): Promise<{ success: boolean; description_id: number; link: Link }> {
    const response = await fetch(`${API_PATHS.links}/${linkId}/descriptions`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        content
      })
    });
    
    return handleResponse<{ success: boolean; description_id: number; link: Link }>(response);
  },
  
  /**
   * 获取相关链接
   */
  async getRelatedLinks(linkId: number, limit: number = 5): Promise<{ related_links: Link[]; method: string }> {
    const params = new URLSearchParams({
      limit: limit.toString()
    });
    
    const response = await fetch(`${API_PATHS.links}/${linkId}/related?${params.toString()}`, {
      method: 'GET',
      headers: createHeaders(false)
    });
    
    return handleResponse<{ related_links: Link[]; method: string }>(response);
  }
}; 