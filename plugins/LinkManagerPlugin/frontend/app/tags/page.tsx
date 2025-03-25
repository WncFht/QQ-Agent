'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Tag {
    id: number
    name: string
    count: number
}

interface LinkItem {
    id: number
    url: string
    title: string
    summary: string
    created_at: string
}

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([])
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
    const [links, setLinks] = useState<LinkItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTags = async () => {
            try {
                setLoading(true)

                // 模拟API调用
                // 实际项目中应该替换为真实的API调用
                // const response = await fetch('/api/tags')
                // const data = await response.json()

                // 模拟数据
                const mockTags: Tag[] = [
                    { id: 1, name: '技术', count: 15 },
                    { id: 2, name: '编程', count: 10 },
                    { id: 3, name: 'Python', count: 8 },
                    { id: 4, name: 'JavaScript', count: 12 },
                    { id: 5, name: '人工智能', count: 5 },
                    { id: 6, name: '机器学习', count: 4 },
                    { id: 7, name: '前端', count: 7 },
                    { id: 8, name: '后端', count: 6 },
                    { id: 9, name: '数据库', count: 3 },
                    { id: 10, name: '云计算', count: 2 }
                ]

                setTags(mockTags)
                setError(null)
            } catch (err) {
                setError('获取标签失败')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchTags()
    }, [])

    useEffect(() => {
        const fetchLinksByTag = async () => {
            if (!selectedTag) {
                setLinks([])
                return
            }

            try {
                setLoading(true)

                // 模拟API调用
                // 实际项目中应该替换为真实的API调用
                // const response = await fetch(`/api/tags/${selectedTag.id}/links`)
                // const data = await response.json()

                // 模拟数据
                const mockLinks: LinkItem[] = Array(selectedTag.count).fill(0).map((_, index) => ({
                    id: index + 1,
                    url: `https://example.com/article${index + 1}`,
                    title: `${selectedTag.name}相关文章 ${index + 1}`,
                    summary: `这是一篇关于${selectedTag.name}的文章，包含了很多有用的信息。`,
                    created_at: new Date(Date.now() - index * 86400000).toISOString()
                }))

                setLinks(mockLinks)
                setError(null)
            } catch (err) {
                setError(`获取标签"${selectedTag.name}"的链接失败`)
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchLinksByTag()
    }, [selectedTag])

    const handleTagClick = (tag: Tag) => {
        setSelectedTag(tag)
    }

    if (loading && !tags.length) {
        return <div className="container mx-auto px-4 py-8">加载中...</div>
    }

    if (error && !tags.length) {
        return <div className="container mx-auto px-4 py-8">错误: {error}</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">标签列表</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => handleTagClick(tag)}
                        className={`p-4 rounded-lg border text-left transition-colors ${selectedTag?.id === tag.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card text-card-foreground border-border hover:bg-muted'
                            }`}
                    >
                        <div className="font-medium">{tag.name}</div>
                        <div className="text-sm opacity-80">{tag.count} 个链接</div>
                    </button>
                ))}
            </div>

            {selectedTag ? (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">"{selectedTag.name}" 相关链接</h2>
                        <button
                            onClick={() => setSelectedTag(null)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            清除选择
                        </button>
                    </div>

                    {loading ? (
                        <div>加载中...</div>
                    ) : error ? (
                        <div className="text-destructive">{error}</div>
                    ) : links.length > 0 ? (
                        <div className="space-y-4">
                            {links.map(link => (
                                <Link href={`/links/${link.id}`} key={link.id}>
                                    <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm hover:shadow transition-shadow">
                                        <h3 className="font-medium mb-1">{link.title}</h3>
                                        <div className="text-sm text-muted-foreground mb-2 break-all">{link.url}</div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{link.summary}</p>
                                        <div className="text-xs text-muted-foreground">
                                            添加于 {new Date(link.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground">未找到相关链接</div>
                    )}
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8 border rounded-lg">
                    请选择一个标签查看相关链接
                </div>
            )}
        </div>
    )
} 