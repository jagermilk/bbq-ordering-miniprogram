# 🚀 烧烤摆摊点单小程序 - 部署指南

本文档提供详细的部署步骤，帮助您将后端API服务部署到生产环境。

## 📋 部署前准备

### 1. 环境检查

确保您已经完成以下准备工作：

- ✅ 项目代码已推送到GitHub仓库
- ✅ 本地测试通过（运行 `npm start` 和 `node test-api.js`）
- ✅ 准备好MongoDB Atlas账号（推荐）
- ✅ 选择部署平台（Railway或Render）

### 2. 数据库准备

#### MongoDB Atlas设置

1. **创建账号和集群**
   ```
   1. 访问 https://www.mongodb.com/cloud/atlas
   2. 注册免费账号
   3. 创建免费M0集群（512MB存储）
   4. 选择云服务商和地区（推荐AWS/Google Cloud）
   ```

2. **配置数据库访问**
   ```
   1. Database Access → Add New Database User
      - 用户名：bbq_admin
      - 密码：生成强密码并保存
      - 权限：Read and write to any database
   
   2. Network Access → Add IP Address
      - 选择 "Allow access from anywhere" (0.0.0.0/0)
      - 或者添加您的部署平台IP地址
   ```

3. **获取连接字符串**
   ```
   1. Clusters → Connect → Connect your application
   2. 选择 Node.js 驱动
   3. 复制连接字符串
   4. 格式：mongodb+srv://username:password@cluster.mongodb.net/bbq-ordering
   ```

## 🚄 方案一：Railway部署（推荐）

### 优势
- 🆓 免费额度充足（每月$5额度）
- 🔒 自动HTTPS证书
- 🔄 GitHub自动部署
- 📊 详细监控面板
- 🌐 全球CDN加速

### 部署步骤

#### 1. 准备Railway账号

```bash
# 访问Railway官网
https://railway.app

# 使用GitHub账号注册登录
# 连接您的GitHub账号
```

#### 2. 创建新项目

```bash
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择您的烧烤摆摊项目仓库
4. 确认导入
```

#### 3. 配置环境变量

在Railway项目设置中添加以下环境变量：

```env
# 基础配置
NODE_ENV=production
PORT=3000

# JWT配置
JWT_SECRET=your-super-secret-production-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# 数据库配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bbq-ordering

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS配置
CORS_ORIGIN=*
```

#### 4. 部署配置

```bash
# Railway会自动检测package.json中的启动命令
# 确保package.json中有正确的start脚本：
"scripts": {
  "start": "node app.js"
}

# Railway会自动安装依赖并启动服务
```

#### 5. 初始化数据库

```bash
# 部署成功后，在Railway控制台中运行：
npm run seed

# 或者通过Railway CLI：
railway run npm run seed
```

#### 6. 验证部署

```bash
# Railway会提供一个公网URL，格式如：
https://your-app-name.up.railway.app

# 测试健康检查：
curl https://your-app-name.up.railway.app/health

# 测试API：
curl https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### Railway CLI使用（可选）

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 链接项目
railway link

# 本地运行（使用远程环境变量）
railway run npm start

# 查看日志
railway logs

# 部署
railway up
```

## 🎨 方案二：Render部署

### 优势
- 🆓 免费计划可用
- 🔒 自动SSL证书
- 🔄 持续部署
- 📝 详细的构建日志
- 💾 持久化存储

### 部署步骤

#### 1. 准备Render账号

```bash
# 访问Render官网
https://render.com

# 使用GitHub账号注册登录
```

#### 2. 创建Web Service

```bash
1. 点击 "New +" → "Web Service"
2. 连接GitHub仓库
3. 选择您的烧烤摆摊项目仓库
4. 点击 "Connect"
```

#### 3. 配置服务

```yaml
# 基本配置
Name: bbq-ordering-api
Environment: Node
Region: Oregon (US West) 或 Frankfurt (Europe)
Branch: main
Root Directory: .

# 构建配置
Build Command: npm install
Start Command: npm start

# 高级配置
Node Version: 18
Health Check Path: /health
Auto-Deploy: Yes
```

#### 4. 配置环境变量

在Render的Environment Variables中添加：

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-production-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bbq-ordering
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=*
```

#### 5. 部署和验证

```bash
# 点击 "Create Web Service"
# Render会自动构建和部署

# 部署完成后，访问提供的URL：
https://your-app-name.onrender.com

# 测试API
curl https://your-app-name.onrender.com/health
```

#### 6. 初始化数据库

```bash
# 在Render控制台的Shell中运行：
npm run seed
```

### Render注意事项

```bash
# 免费计划限制：
- 服务会在15分钟无活动后休眠
- 冷启动可能需要30秒
- 每月750小时运行时间
- 512MB RAM限制

# 生产环境建议升级到付费计划
```

## 🔧 方案三：本地生产环境部署

### 适用场景
- 内网部署
- 自有服务器
- 开发测试环境

### 部署步骤

#### 1. 服务器准备

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm mongodb-server nginx

# CentOS/RHEL
sudo yum install nodejs npm mongodb-server nginx

# 或者使用Docker
docker pull node:18-alpine
docker pull mongo:latest
```

#### 2. 项目部署

```bash
# 克隆项目
git clone <your-repo-url>
cd bbq-ordering-backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
vim .env  # 编辑配置

# 初始化数据库
npm run seed

# 启动服务
npm start
```

#### 3. 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bbq-ordering-api',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save

# 监控
pm2 monit
```

#### 4. Nginx反向代理

```nginx
# /etc/nginx/sites-available/bbq-ordering
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/your/project/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/bbq-ordering /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 安全配置

### 生产环境安全检查清单

```bash
✅ JWT密钥
- 使用强随机密钥（至少32字符）
- 定期更换密钥
- 不要在代码中硬编码

✅ 数据库安全
- 使用强密码
- 启用数据库认证
- 限制IP访问白名单
- 定期备份数据

✅ HTTPS配置
- 生产环境必须使用HTTPS
- 配置SSL证书（Let's Encrypt免费）
- 强制HTTPS重定向

✅ 环境变量
- 敏感信息存储在环境变量中
- 不要提交.env文件到版本控制
- 使用密钥管理服务

✅ API安全
- 启用速率限制
- 输入验证和过滤
- 错误信息不泄露敏感信息
- 启用CORS白名单
```

### SSL证书配置（Let's Encrypt）

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和日志

### 应用监控

```bash
# 使用PM2监控
pm2 monit
pm2 logs
pm2 status

# 查看系统资源
htop
df -h
free -h
```

### 日志管理

```bash
# 应用日志
tail -f logs/combined.log

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u nginx -f
journalctl -u mongodb -f
```

### 性能优化

```bash
# Node.js优化
export NODE_OPTIONS="--max-old-space-size=1024"

# MongoDB优化
- 创建适当的索引
- 定期清理过期数据
- 监控慢查询

# Nginx优化
- 启用gzip压缩
- 配置静态文件缓存
- 调整worker进程数
```

## 🐛 故障排除

### 常见问题和解决方案

#### 1. 部署失败

```bash
# 检查构建日志
- Railway: 查看Deployments页面
- Render: 查看Build Logs

# 常见原因：
- package.json中缺少start脚本
- Node.js版本不兼容
- 环境变量配置错误
- 依赖安装失败
```

#### 2. 数据库连接失败

```bash
# 检查连接字符串
echo $MONGODB_URI

# 测试连接
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err));"

# 常见原因：
- IP白名单未配置
- 用户名密码错误
- 网络连接问题
- 数据库服务未启动
```

#### 3. API请求失败

```bash
# 检查服务状态
curl https://your-domain.com/health

# 检查CORS配置
- 确保CORS_ORIGIN正确配置
- 检查请求头设置

# 检查JWT认证
- 确保JWT_SECRET配置正确
- 检查token格式和有效期
```

#### 4. 文件上传失败

```bash
# 检查上传目录权限
ls -la uploads/

# 检查磁盘空间
df -h

# 检查文件大小限制
echo $MAX_FILE_SIZE
```

### 日志分析

```bash
# 查看错误日志
grep -i error logs/combined.log

# 查看访问统计
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr

# 监控响应时间
awk '{print $NF}' /var/log/nginx/access.log | sort -n
```

## 📞 技术支持

### 获取帮助

```bash
# 文档资源
- 项目README.md
- API文档
- 部署指南

# 社区支持
- GitHub Issues
- 技术论坛
- 开发者社群

# 专业支持
- 技术咨询
- 定制开发
- 运维服务
```

### 联系方式

```
📧 邮箱：support@bbq-ordering.com
💬 微信：BBQ_Support
🐛 Bug报告：GitHub Issues
📚 文档：项目Wiki
```

---

**祝您部署顺利！🎉**

如果在部署过程中遇到任何问题，请参考故障排除部分或联系技术支持。