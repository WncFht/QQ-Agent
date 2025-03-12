# AI 聊天机器人插件 (ChatbotPlugin)

## 简介

AI 聊天机器人插件是一个基于 NcatBot 框架的 QQ 机器人插件，允许用户通过 @ 机器人的方式进行 AI 对话。插件支持会话记忆功能，可以记住用户在同一会话中的历史对话内容，提供连贯的交流体验。

## 功能特点

1. **智能对话**：基于大语言模型的智能对话功能
2. **会话记忆**：在一次会话中记住对话历史，保持对话连贯性
3. **会话管理**：支持使用特定命令开始和结束会话
4. **群聊和私聊支持**：同时支持群聊和私聊使用

## 使用方法

### 开始会话

在群聊中，@ 机器人并发送 "start" 命令开始会话：

```
@机器人 start
```

在私聊中，直接发送消息即开始会话。

### 进行对话

在群聊中，@ 机器人并发送你的消息：

```
@机器人 你好，请问今天天气如何？
```

机器人会根据你的问题回复，并记住对话内容。

### 结束会话

在群聊中，@ 机器人并发送 "end" 命令结束会话：

```
@机器人 end
```

结束会话后，对话历史会被保存，但不会影响下一次会话。

## 技术实现

插件基于 OpenAI API 接口或兼容 OpenAI API 的本地大语言模型（如 ChatGLM）实现对话功能。默认配置为连接本地部署的 ChatGLM 模型。

## 数据存储

插件将用户的对话历史记录存储在 `data/chatbot_history.json` 文件中，格式如下：

```json
{
  "用户ID1": [
    {"role": "system", "content": "系统指令"},
    {"role": "user", "content": "用户消息1"},
    {"role": "assistant", "content": "AI回复1"},
    ...
  ],
  "用户ID2": [
    ...
  ]
}
```

## 配置项

插件的配置项包括：

- `history_file`：历史记录文件路径
- `model`：使用的语言模型名称
- `base_url`：API 服务的基础 URL
- `api_key`：API 密钥（本地部署时可为 "EMPTY"）
- `max_tokens`：生成回复的最大令牌数
- `temperature`：生成多样性参数
- `presence_penalty`：重复惩罚参数
- `top_p`：采样概率阈值
- `max_history`：记忆的最大消息数量

## 依赖项

- openai：用于调用 OpenAI 或兼容的 API
- ncatbot：QQ 机器人框架

## 配置示例

```python
# 配置示例
config = {
    "history_file": "data/chatbot_history.json",
    "model": "chatglm3-6b",  # 或其他支持的模型
    "base_url": "http://127.0.0.1:8000/v1/",  # 本地API地址
    "api_key": "EMPTY",  # 本地部署时可使用空值
    "max_tokens": 256,
    "temperature": 0.7,
    "presence_penalty": 0.6,
    "top_p": 0.9,
    "max_history": 10  # 记忆的最大消息数
}
```

## 安装方法

1. 将插件文件放入 NcatBot 的 plugins 目录
2. 安装依赖：`pip install openai`
3. 配置 LLM API 地址和相关参数
4. 重启 NcatBot

## 使用示例

### 基本使用流程

在群聊中：
1. @机器人 start - 开始对话
2. @机器人 你好，请介绍一下自己 - 进行对话
3. @机器人 end - 结束对话

### 代码示例

```python
from ncatbot.core import BotClient
from ncatbot.plugin import register_plugin
from ChatbotPlugin.main import ChatbotPlugin

bot = BotClient()
chatbot = ChatbotPlugin()
register_plugin(chatbot)

bot.run()
```

## 注意事项

1. 插件默认配置连接本地部署的语言模型，如需使用 OpenAI 的服务，请修改配置中的 `base_url` 和 `api_key`
2. 为了避免消耗过多资源，插件限制了每个用户的历史记忆长度
3. 会话在用户明确结束前会一直保持激活状态