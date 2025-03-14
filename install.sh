#!/bin/bash

# 安装依赖
pip install -r requirements.txt

# 安装插件
for plugin in plugins/*; do
    if [ -d "$plugin" ]; then
        echo "安装插件: $plugin"
        if [ -f "$plugin/requirements.txt" ]; then
            pip install -r "$plugin/requirements.txt"
        fi
    fi
done
