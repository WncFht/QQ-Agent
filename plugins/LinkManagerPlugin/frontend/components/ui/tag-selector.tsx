'use client'

import { useState, useEffect } from 'react'

interface Tag {
    id: number
    name: string
}

interface TagSelectorProps {
    tags: Tag[]
    selectedTags: number[]
    onTagSelect: (tagIds: number[]) => void
    loading?: boolean
    error?: string | null
    className?: string
}

export default function TagSelector({
    tags,
    selectedTags,
    onTagSelect,
    loading = false,
    error = null,
    className = ''
}: TagSelectorProps) {
    const toggleTag = (tagId: number) => {
        const isSelected = selectedTags.includes(tagId)
        const newSelectedTags = isSelected
            ? selectedTags.filter(id => id !== tagId)
            : [...selectedTags, tagId]

        onTagSelect(newSelectedTags)
    }

    const clearSelection = () => {
        onTagSelect([])
    }

    if (loading) {
        return (
            <div className={`p-4 border rounded-lg ${className}`}>
                <div className="text-center text-muted-foreground">加载标签中...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`p-4 border rounded-lg ${className}`}>
                <div className="text-center text-destructive">错误: {error}</div>
            </div>
        )
    }

    if (!tags.length) {
        return (
            <div className={`p-4 border rounded-lg ${className}`}>
                <div className="text-center text-muted-foreground">暂无可用标签</div>
            </div>
        )
    }

    return (
        <div className={`p-4 border rounded-lg ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">按标签筛选</h3>
                {selectedTags.length > 0 && (
                    <button
                        onClick={clearSelection}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        清除选择
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                    const isSelected = selectedTags.includes(tag.id)
                    return (
                        <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-foreground'
                                }`}
                        >
                            {tag.name}
                        </button>
                    )
                })}
            </div>
        </div>
    )
} 