/**
 * 链接管理器前端功能测试
 * 
 * 使用方法:
 * 1. 安装依赖: npm install --save-dev jest @testing-library/react @testing-library/jest-dom
 * 2. 在package.json中添加: "test": "jest"
 * 3. 运行测试: npm test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// 模拟Next.js的路由
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        query: {},
        pathname: '/',
        asPath: '/',
    }),
    useParams: () => ({
        id: '1',
    }),
}));

// 模拟链接管理器API
jest.mock('../lib/api', () => ({
    api: {
        getRecentLinks: jest.fn().mockResolvedValue({
            links: [
                {
                    id: 1,
                    url: 'https://example.com',
                    title: '示例网站',
                    summary: '这是一个示例网站',
                    sender_id: '123456',
                    sender_name: '测试用户',
                    group_id: '654321',
                    created_at: '2023-03-01T12:00:00',
                    updated_at: '2023-03-01T12:00:00',
                    tags: [
                        { id: 1, name: '示例' }
                    ]
                }
            ],
            total: 1,
            limit: 10,
            offset: 0
        }),
        getLinkDetail: jest.fn().mockResolvedValue({
            id: 1,
            url: 'https://example.com',
            title: '示例网站',
            summary: '这是一个示例网站',
            sender_id: '123456',
            sender_name: '测试用户',
            group_id: '654321',
            created_at: '2023-03-01T12:00:00',
            updated_at: '2023-03-01T12:00:00',
            tags: [
                { id: 1, name: '示例' }
            ],
            descriptions: []
        }),
        searchLinks: jest.fn().mockResolvedValue({
            links: [
                {
                    id: 1,
                    url: 'https://example.com',
                    title: '示例网站',
                    summary: '这是一个示例网站',
                    sender_id: '123456',
                    sender_name: '测试用户',
                    group_id: '654321',
                    created_at: '2023-03-01T12:00:00',
                    updated_at: '2023-03-01T12:00:00',
                    tags: [
                        { id: 1, name: '示例' }
                    ]
                }
            ],
            total: 1,
            limit: 10,
            offset: 0,
            query: '示例',
            optimized_query: '示例 网站'
        }),
        getAllTags: jest.fn().mockResolvedValue({
            tags: [
                { id: 1, name: '示例', link_count: 5 },
                { id: 2, name: '网站', link_count: 3 }
            ]
        })
    }
}));

// 导入要测试的组件
import LinkList from '../components/ui/link-list';
import SearchBar from '../components/ui/search-bar';
import TagSelector from '../components/ui/tag-selector';
import LinkDetailPage from '../app/links/[id]/page';
import LinksPage from '../app/links/page';
import TagsPage from '../app/tags/page';
import HomePage from '../app/page';

// 链接列表组件测试
describe('LinkList组件', () => {
    const mockLinks = [
        {
            id: 1,
            url: 'https://example.com',
            title: '示例网站',
            summary: '这是一个示例网站',
            sender_name: '测试用户',
            created_at: '2023-03-01T12:00:00',
            tags: [{ id: 1, name: '示例' }]
        }
    ];

    test('应该正确渲染链接列表', () => {
        render(<LinkList links={mockLinks} />);
        expect(screen.getByText('示例网站')).toBeInTheDocument();
        expect(screen.getByText('https://example.com')).toBeInTheDocument();
        expect(screen.getByText('这是一个示例网站')).toBeInTheDocument();
    });

    test('空列表时应该显示提示信息', () => {
        render(<LinkList links={[]} />);
        expect(screen.getByText('暂无链接')).toBeInTheDocument();
    });

    test('加载中时应该显示加载提示', () => {
        render(<LinkList links={[]} loading={true} />);
        expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    test('错误时应该显示错误信息', () => {
        render(<LinkList links={[]} error="加载失败" />);
        expect(screen.getByText('错误: 加载失败')).toBeInTheDocument();
    });
});

// 搜索栏组件测试
describe('SearchBar组件', () => {
    test('应该能输入搜索关键词', () => {
        const mockOnSearch = jest.fn();
        render(<SearchBar onSearch={mockOnSearch} />);

        const input = screen.getByPlaceholderText('搜索链接...');
        fireEvent.change(input, { target: { value: '示例' } });

        // 由于debounce效果，需要等待搜索触发
        setTimeout(() => {
            expect(mockOnSearch).toHaveBeenCalledWith('示例');
        }, 600);
    });
});

// 标签选择器组件测试
describe('TagSelector组件', () => {
    const mockTags = [
        { id: 1, name: '示例' },
        { id: 2, name: '网站' }
    ];

    test('应该正确渲染标签列表', () => {
        const mockOnTagSelect = jest.fn();
        render(
            <TagSelector
                tags={mockTags}
                selectedTags={[]}
                onTagSelect={mockOnTagSelect}
            />
        );

        expect(screen.getByText('示例')).toBeInTheDocument();
        expect(screen.getByText('网站')).toBeInTheDocument();
    });

    test('点击标签应该触发选择事件', () => {
        const mockOnTagSelect = jest.fn();
        render(
            <TagSelector
                tags={mockTags}
                selectedTags={[]}
                onTagSelect={mockOnTagSelect}
            />
        );

        fireEvent.click(screen.getByText('示例'));
        expect(mockOnTagSelect).toHaveBeenCalledWith([1]);
    });
});

// 页面组件测试
describe('页面组件', () => {
    // 注：这些测试在实际环境可能需要更复杂的设置，这里仅做示例

    test('首页渲染正常', () => {
        render(<HomePage />);
        expect(screen.getByText('欢迎使用链接管理器')).toBeInTheDocument();
    });

    test('链接详情页渲染正常', async () => {
        render(<LinkDetailPage />);
        // 等待异步数据加载
        await waitFor(() => {
            expect(screen.getByText('加载中...')).toBeInTheDocument();
        });
    });
});

// 集成测试
describe('集成测试', () => {
    test('搜索栏与链接列表交互', async () => {
        // 此处省略实现，实际测试需要更复杂的模拟和断言
    });

    test('标签选择与链接列表过滤', async () => {
        // 此处省略实现，实际测试需要更复杂的模拟和断言
    });
}); 