# 链接管理器部署指南

本文档将指导你如何部署链接管理器系统，包括QQ机器人、API服务和前端应用。

## 系统要求

- 操作系统: Linux (Ubuntu 20.04+推荐)
- Python 3.10+
- Node.js 18+
- Nginx
- Supervisor
- Conda

## 部署步骤

### 1. 克隆代码库

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. 后端环境配置

使用Conda创建环境:

```bash
cd plugins/LinkManagerPlugin
conda env create -f environment.yml
conda activate linkmanager
```

### 3. 前端构建

```bash
cd plugins/LinkManagerPlugin/frontend
npm install
npm run build
```

### 4. 配置文件设置

复制并修改配置文件:

```bash
cp plugins/LinkManagerPlugin/config.json.example plugins/LinkManagerPlugin/config.json
# 编辑config.json，填写必要的配置信息
```

### 5. 配置SSL证书

如果你已有SSL证书，复制到适当位置；如果没有，可以使用Let's Encrypt免费获取:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6. 配置Nginx

复制Nginx配置文件:

```bash
sudo cp plugins/LinkManagerPlugin/deploy/nginx.conf /etc/nginx/sites-available/linkmanager
sudo ln -s /etc/nginx/sites-available/linkmanager /etc/nginx/sites-enabled/
```

编辑配置文件，替换示例域名和证书路径。

### 7. 配置Supervisor

创建日志目录:

```bash
sudo mkdir -p /var/log/linkmanager
sudo chown -R your-user:your-group /var/log/linkmanager
```

复制Supervisor配置:

```bash
sudo cp plugins/LinkManagerPlugin/deploy/supervisor.conf /etc/supervisor/conf.d/linkmanager.conf
```

编辑配置文件，替换路径和用户信息。

### 8. 启动服务

重新加载配置并启动服务:

```bash
sudo systemctl reload nginx
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start linkmanager:*
```

### 9. 验证部署

访问你的域名，确认前端网站可以正常访问。
测试API接口: `https://your-domain.com/api/health`
检查QQ机器人是否正常运行。

## 常见问题

### 无法访问网站
- 检查Nginx配置和日志
- 确认端口是否开放
- 检查SSL证书是否有效

### API不可用
- 检查Supervisor日志
- 确认API服务是否正在运行
- 检查配置文件是否正确

### QQ机器人不响应
- 检查Supervisor日志
- 确认QQ机器人配置是否正确
- 检查网络连接

## 更新部署

当你需要更新系统时，请按以下步骤操作:

```bash
# 拉取最新代码
git pull

# 更新后端
conda activate linkmanager
cd plugins/LinkManagerPlugin
pip install -r requirements.txt

# 更新前端
cd frontend
npm install
npm run build

# 重启服务
sudo supervisorctl restart linkmanager:*
``` 