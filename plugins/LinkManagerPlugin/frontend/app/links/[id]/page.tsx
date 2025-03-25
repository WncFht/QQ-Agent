'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface LinkDetail {
    id: number
    url: string
    title: string
    summary: string
    sender_name: string
    created_at: string
    tags: Array<{ id: number, name: string }>
    descriptions: Array<{
        id: number
        content: string
        username: string
        created_at: string
    }>
}

interface RelatedLink {
    id: number
    url: string
    title: string
    summary: string
}

export default function LinkDetailPage() {
    const params = useParams()
    const id = params?.id as string

    const [link, setLink] = useState<LinkDetail | null>(null)
    const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLinkDetail = async () => {
            try {
                setLoading(true)

                // 模拟API调用
                // 实际项目中应该替换为真实的API调用
                // const response = await fetch(`/api/links/${id}`)
                // const data = await response.json()

                // 模拟数据
                const mockData: LinkDetail = {
                    id: parseInt(id),
                    url: 'https://example.com/article',
                    title: '示例文章标题',
                    summary: '这是一篇关于示例主题的文章。包含了很多有用的信息和见解。',
                    sender_name: '张三',
                    created_at: '2023-03-01T12:30:45',
                    tags: [
                        { id: 1, name: '技术' },
                        { id: 2, name: '编程' },
                        { id: 3, name: 'Python' }
                    ],
                    descriptions: [
                        {
                            id: 1,
                            content: '这是一个非常有用的技术文章，解释了如何实现异步编程。',
                            username: '张三',
                            created_at: '2023-03-01T12:30:45'
                        },
                        {
                            id: 2,
                            content: '我也觉得这篇文章很棒，特别是对于初学者来说。',
                            username: '李四',
                            created_at: '2023-03-02T14:20:10'
                        }
                    ]
                }

                // 模拟相关链接
                const mockRelated: RelatedLink[] = [
                    {
                        id: parseInt(id) + 1,
                        url: 'https://example.com/related1',
                        title: '相关文章1',
                        summary: '这是一篇相关文章'
                    },
                    {
                        id: parseInt(id) + 2,
                        url: 'https://example.com/related2',
                        title: '相关文章2',
                        summary: '这是另一篇相关文章'
                    }
                ]

                setLink(mockData)
                setRelatedLinks(mockRelated)
                setError(null)
            } catch (err) {
                setError('获取链接详情失败')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchLinkDetail()
    }, [id])

    if (loading) {
        return <div className="container mx-auto px-4 py-8">加载中...</div>
    }

    if (error || !link) {
        return <div className="container mx-auto px-4 py-8">错误: {error || '找不到链接'}</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <Link href="/links" className="text-primary hover:underline">
                    &larr; 返回链接列表
                </Link>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border p-6 shadow mb-8">
                <h1 className="text-2xl font-bold mb-2">{link.title}</h1>

                <div className="mb-4">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary break-all hover:underline">
                        {link.url}
                    </a>
                </div>

                <div className="mb-4">
                    <p className="text-muted-foreground">{link.summary}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {link.tags.map(tag => (
                        <span key={tag.id} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                            {tag.name}
                        </span>
                    ))}
                </div>

                <div className="text-sm text-muted-foreground">
                    由 {link.sender_name} 添加于 {new Date(link.created_at).toLocaleString()}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">描述</h2>
                {link.descriptions.length > 0 ? (
                    <div className="space-y-4">
                        {link.descriptions.map(desc => (
                            <div key={desc.id} className="bg-muted p-4 rounded-md">
                                <p>{desc.content}</p>
                                <div className="mt-2 text-sm text-muted-foreground">
                                    {desc.username} - {new Date(desc.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">暂无描述</p>
                )}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">相关链接</h2>
                {relatedLinks.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {relatedLinks.map(related => (
                            <Link href={`/links/${related.id}`} key={related.id}>
                                <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm hover:shadow transition-shadow">
                                    <h3 className="font-medium mb-2">{related.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{related.summary}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">暂无相关链接</p>
                )}
            </div>
        </div>
    )
} 