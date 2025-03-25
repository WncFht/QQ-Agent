# 群管理插件 (GroupManagerPlugin)

这是一个用于QQ群管理的插件，提供了一系列群管理功能，包括设置群头衔和 AI 问答等。

## 功能列表

1. **设置群头衔**
   - 为自己设置群头衔
   - 支持群聊中直接操作

2. **AI 问答**
   - 支持多种 AI API（百度、OpenAI 等）
   - 可以指定使用的 API
   - 支持群聊和私聊

## 使用方法

### 设置群头衔

```
添加头衔 <头衔内容> - 为自己设置群头衔
```

示例：
```
添加头衔 技术大佬
```

### AI 问答

```
AI <问题内容> - 使用默认 API 回答问题
AI @baidu <问题内容> - 使用百度 API 回答问题
AI @openai <问题内容> - 使用 OpenAI API 回答问题
```

示例：
```
AI 你好，请介绍一下自己
AI @baidu 写一首关于春天的诗
```

## 配置说明

插件使用 `.env` 文件进行配置，支持以下配置项：

```
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=256
OPENAI_TEMPERATURE=0.7

# 百度 API 配置
BAIDU_API_KEY=your_baidu_api_key_here
BAIDU_BASE_URL=https://qianfan.baidubce.com/v2
BAIDU_MODEL=qwq-32b
BAIDU_MAX_TOKENS=256
BAIDU_TEMPERATURE=0.7

# 默认使用的 API
DEFAULT_API=baidu
```

首次运行时，插件会自动从 `.env.example` 创建 `.env` 文件，用户需要编辑该文件填入自己的 API 密钥。

## 权限要求

- 设置群头衔需要机器人拥有群管理员或群主权限
- 普通用户可以使用此功能为自己设置头衔（机器人会检查权限并执行）
- AI 问答功能不需要特殊权限

## 注意事项

1. 头衔长度有限制，一般不超过6个字符
2. 部分特殊字符可能无法设置成功
3. 如果机器人没有相应权限，会提示权限不足
4. AI 问答功能需要配置相应的 API 密钥才能使用 