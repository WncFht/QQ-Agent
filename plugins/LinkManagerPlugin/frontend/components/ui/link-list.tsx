'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LinkItem {
    id: number
    url: string
    title: string
    summary: string
    created_at: string
    sender_name: string
    tags: Array<{ id: number, name: string }>
}

interface LinkListProps {
    links: LinkItem[]
    loading?: boolean
    error?: string | null
    emptyMessage?: string
}

export default function LinkList({
    links,
    loading = false,
    error = null,
    emptyMessage = '暂无链接'
}: LinkListProps) {
    if (loading) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                加载中...
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-8 text-center text-destructive">
                错误: {error}
            </div>
        )
    }

    if (!links.length) {
        return (
            <div className="py-8 text-center text-muted-foreground border rounded-lg">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {links.map(link => (
                <LinkCard key={link.id} link={link} />
            ))}
        </div>
    )
}

function LinkCard({ link }: { link: LinkItem }) {
    const [isExpanded, setIsExpanded] = useState(false)

    const formattedDate = new Date(link.created_at).toLocaleDateString()
    const hasLongSummary = link.summary.length > 150
    const displaySummary = isExpanded || !hasLongSummary
        ? link.summary
        : `${link.summary.substring(0, 150)}...`

    return (
        <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
            <div className="mb-1">
                <Link href={`/links/${link.id}`} className="font-medium hover:underline">
                    {link.title}
                </Link>
            </div>

            <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary break-all hover:underline mb-2 inline-block"
            >
                {link.url}
            </a>

            <div className="text-sm text-muted-foreground mb-2">
                {displaySummary}
                {hasLongSummary && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-primary text-xs ml-1 hover:underline"
                    >
                        {isExpanded ? '收起' : '展开'}
                    </button>
                )}
            </div>

            {link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {link.tags.map(tag => (
                        <Link
                            href={`/tags?selected=${tag.id}`}
                            key={tag.id}
                            className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs hover:bg-primary/20"
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>
            )}

            <div className="text-xs text-muted-foreground flex justify-between">
                <span>由 {link.sender_name} 提交</span>
                <span>{formattedDate}</span>
            </div>
        </div>
    )
} 