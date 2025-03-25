'use client'

import { useState } from 'react'
import LinkList from '../../components/link-list'
import SearchBar from '../../components/search-bar'
import TagSelector from '../../components/tag-selector'

export default function LinksPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [sortBy, setSortBy] = useState('newest')

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">链接库</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="md:col-span-3">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="搜索链接..."
                    />
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                >
                    <option value="newest">最新添加</option>
                    <option value="oldest">最早添加</option>
                    <option value="popular">最受欢迎</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <TagSelector
                        selectedTags={selectedTags}
                        onChange={setSelectedTags}
                    />
                </div>

                <div className="md:col-span-3">
                    <LinkList
                        tags={selectedTags}
                        sortBy={sortBy}
                        searchQuery={searchQuery}
                    />
                </div>
            </div>
        </div>
    )
} 