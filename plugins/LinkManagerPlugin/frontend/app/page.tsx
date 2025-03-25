export default function Home() {
    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-6">欢迎使用链接管理器</h1>
                <p className="text-xl mb-8 text-muted-foreground">
                    一个高效的链接收集、分类和共享工具
                </p>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
                    <FeatureCard
                        title="智能分类"
                        description="利用大语言模型自动为链接添加标签和摘要"
                        icon="🏷️"
                    />
                    <FeatureCard
                        title="搜索功能"
                        description="通过关键词和标签快速查找您保存的链接"
                        icon="🔍"
                    />
                    <FeatureCard
                        title="QQ机器人集成"
                        description="在群聊中自动捕获和管理链接"
                        icon="🤖"
                    />
                </div>

                <div className="mt-12">
                    <a
                        href="/links"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-lg font-medium text-primary-foreground shadow hover:bg-primary/90"
                    >
                        开始使用
                    </a>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
    return (
        <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
} 