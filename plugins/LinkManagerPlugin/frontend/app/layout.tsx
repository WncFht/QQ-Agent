import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: '链接管理器',
    description: '一个高效的链接收集、分类和共享工具',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN">
            <body>
                <div className="flex flex-col min-h-screen">
                    <header className="bg-primary text-primary-foreground py-4">
                        <div className="container flex justify-between items-center">
                            <h1 className="text-2xl font-bold">链接管理器</h1>
                            <nav>
                                <ul className="flex space-x-4">
                                    <li><a href="/" className="hover:underline">首页</a></li>
                                    <li><a href="/links" className="hover:underline">链接库</a></li>
                                    <li><a href="/tags" className="hover:underline">标签</a></li>
                                </ul>
                            </nav>
                        </div>
                    </header>

                    <main className="flex-grow">
                        {children}
                    </main>

                    <footer className="bg-muted py-4 mt-8">
                        <div className="container text-center text-muted-foreground">
                            <p>© {new Date().getFullYear()} 链接管理器 - 由 Next.js, FastAPI 和 QQ 机器人提供支持</p>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    )
} 