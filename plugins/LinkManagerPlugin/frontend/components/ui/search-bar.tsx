'use client'

import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { Search } from 'lucide-react' // 假设使用lucide-react图标库

interface SearchBarProps {
    onSearch: (query: string) => void
    initialQuery?: string
    placeholder?: string
    className?: string
}

export default function SearchBar({
    onSearch,
    initialQuery = '',
    placeholder = '搜索链接...',
    className = ''
}: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery)
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)

    // 处理用户输入
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value)
    }

    // 处理表单提交
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSearch(query)
    }

    // 使用防抖进行自动搜索
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)

        return () => clearTimeout(timer)
    }, [query])

    // 当防抖查询变化时触发搜索
    useEffect(() => {
        if (debouncedQuery !== initialQuery) {
            onSearch(debouncedQuery)
        }
    }, [debouncedQuery, initialQuery, onSearch])

    return (
        <form onSubmit={handleSubmit} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full bg-background border border-input rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <Search size={16} />
                </div>
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('')
                            onSearch('')
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        ×
                    </button>
                )}
            </div>
        </form>
    )
} 