from ncatbot.core.client import BotClient
from ncatbot.core.message import *
from ncatbot.utils.config import config
from ncatbot.core.element import (
    MessageChain,  # 消息链，用于组合多个消息元素
    Text,          # 文本消息
    Reply,         # 回复消息
    At,            # @某人
    AtAll,         # @全体成员
    Dice,          # 骰子
    Face,          # QQ表情
    Image,         # 图片
    Json,          # JSON消息
    Music,         # 音乐分享 (网易云, QQ 音乐等)
    CustomMusic,   # 自定义音乐分享
    Record,        # 语音
    Rps,           # 猜拳
    Video,         # 视频
    File,          # 文件
)
import os
import asyncio

# 基础配置
CONFIG = {
    "ws_uri": "ws://localhost:3001",
    "admin_qq": ["2130212584"],  # 管理员QQ号列表
    "bot_qq": "2118660656",  # 机器人QQ号，请修改为你的机器人QQ号
}

# 设置WebSocket URI和机器人QQ号
config.set_ws_uri(CONFIG["ws_uri"])
config.set_bot_uin(CONFIG["bot_qq"])  # 设置机器人QQ号
config.set_token("")  # 如果有token，请设置

# 初始化机器人客户端
bot = BotClient()

if __name__ == "__main__":
    # 运行机器人，自动加载plugins目录下的所有插件
    # asyncio.run(bot.run(reload=True)) 
    asyncio.run(bot.run())