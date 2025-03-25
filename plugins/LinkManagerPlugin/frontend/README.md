# 链接管理器前端

## 项目概述

链接管理器前端是一个使用Next.js和TailwindCSS开发的现代Web应用，用于展示和管理QQ机器人收集的链接。它提供了友好的用户界面，允许用户浏览、搜索、过滤和查看详细信息。

## 功能特性

- **首页**: 概述应用功能和特点
- **链接库**: 展示所有链接，支持搜索、标签过滤和排序
- **链接详情**: 显示链接的详细信息，包括摘要、标签和描述
- **标签页**: 按标签分类浏览链接
- **响应式设计**: 适配各种设备尺寸

## 技术栈

- **Next.js 14**: React框架，用于构建用户界面
- **TypeScript**: 提供类型安全
- **TailwindCSS**: 实用工具优先的CSS框架
- **Lucide Icons**: 图标库

## 开发设置

### 前置条件

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 确保已安装Node.js
2. 安装依赖:

```bash
cd plugins/LinkManagerPlugin/frontend
npm install
# 或
yarn install
```

### 开发服务器

启动开发服务器:

```bash
npm run dev
# 或
yarn dev
```

开发服务器将在 [http://localhost:3000](http://localhost:3000) 运行。

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 目录结构

```
frontend/
├── app/                  # Next.js应用目录
│   ├── page.tsx          # 首页
│   ├── layout.tsx        # 布局组件
│   ├── globals.css       # 全局样式
│   ├── links/            # 链接相关页面
│   │   ├── page.tsx      # 链接列表页
│   │   └── [id]/         # 动态路由
│   │       └── page.tsx  # 链接详情页
│   └── tags/             # 标签页
│       └── page.tsx      # 标签列表和过滤页
├── components/           # 共享组件
│   └── ui/               # UI组件
│       ├── link-list.tsx # 链接列表组件
│       ├── search-bar.tsx# 搜索栏组件
│       └── tag-selector.tsx # 标签选择器组件
├── lib/                  # 通用库和工具
│   ├── api.ts            # API客户端
│   └── utils.ts          # 工具函数
├── public/               # 静态文件
├── next.config.js        # Next.js配置
├── postcss.config.js     # PostCSS配置
├── tailwind.config.js    # TailwindCSS配置
└── tsconfig.json         # TypeScript配置
```

## 与后端集成

前端应用通过API与FastAPI后端进行通信。API端点配置在`lib/api.ts`文件中。在开发模式下，API请求会通过Next.js的代理功能转发到后端服务。

## 部署

建议将前端应用与FastAPI后端一起部署，使用Nginx作为反向代理。详细部署步骤请参见项目根目录下的部署文档。

## 贡献

欢迎提交Pull Request或提出Issue。

## 许可证

该项目采用MIT许可证。 