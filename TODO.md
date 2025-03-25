# LinkManagerPlugin 待办事项清单

## 基础架构
- [x] 创建基本的文件和目录结构
- [x] 用 conda 配置开发环境，写一个 requirements.yml 文件

## 后端开发
- [x] 实现插件入口`__init__.py`
- [x] 实现主类`main.py`及QQ机器人接口
- [x] 编写`config.py`配置管理模块
- [x] 实现`database.py`数据库操作封装
- [x] 实现`link_manager.py`核心链接管理类
- [x] 实现`link_extractor.py`链接提取工具
- [x] 实现`link_summarizer.py`链接内容总结功能
- [x] 实现`link_classifier.py`标签分类器
- [x] 编写`prompts.py`提示词模板
- [x] 实现`api_client.py`LLM API客户端

## FastAPI后端
- [x] 创建`api/main.py`FastAPI应用入口
- [x] 实现链接相关API路由`api/routers/links.py`
- [x] 实现认证相关API路由`api/routers/auth.py`
- [x] 实现标签相关API路由`api/routers/tags.py`
- [x] 创建数据模型`api/models/`
- [x] 实现认证依赖`api/dependencies/auth.py`
- [x] 配置CORS中间件

## 前端开发 (NextJS)
- [x] 创建NextJS项目
- [x] 安装配置TailwindCSS
- [x] 安装配置Shadcn/ui组件库
- [x] 实现首页`app/page.tsx`
- [x] 实现链接列表页`app/links/page.tsx`
- [x] 实现链接详情页`app/links/[id]/page.tsx`
- [x] 实现页面布局`app/layout.tsx`
- [x] 创建UI组件`components/ui/`
- [x] 实现链接卡片组件`components/link-card.tsx`
- [x] 实现链接列表组件`components/link-list.tsx`
- [x] 实现标签选择器组件`components/tag-selector.tsx`
- [x] 实现搜索栏组件`components/search-bar.tsx`
- [x] 开发API客户端`lib/api.ts`
- [x] 实现工具函数`lib/utils.ts`

## QQ机器人功能
- [x] 实现链接自动提取功能
- [x] 实现添加链接命令
- [x] 实现查看链接命令
- [x] 实现搜索链接命令
- [x] 实现帮助命令

## 数据库
- [x] 设计并创建SQLite数据库结构
- [x] 创建links表
- [x] 创建tags表
- [x] 创建link_tags表
- [x] 创建descriptions表

## 大模型集成
- [x] 实现链接内容抓取
- [x] 集成OpenAI兼容API接口
- [x] 集成HuggingFace接口
- [x] 实现链接摘要生成
- [x] 实现链接标签自动分类

## 部署相关
- [x] 配置SSL证书
- [x] 配置Nginx反向代理
- [x] 配置Supervisor进程管理
- [x] 设置开机自启动

## 测试
- [x] 编写QQ机器人功能测试用例
- [x] 编写API接口测试用例
- [x] 进行前端功能测试
- [x] 进行集成测试

## 文档
- [x] 编写安装部署文档
- [x] 编写用户使用手册
- [x] 编写API文档
