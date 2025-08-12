# 烧烤摆摊点单小程序后端API

一个基于Node.js + Express + MongoDB的多角色点餐系统后端服务，支持用户扫码点餐和商户管理功能。

## 🚀 项目特色

- **多角色系统**：支持普通用户和商户用户，根据角色权限控制功能
- **多商户支持**：每个商户只能管理自己的数据，数据隔离安全
- **RESTful API**：标准化API设计，支持CORS跨域
- **JWT认证**：安全的用户认证机制
- **文件上传**：支持菜品图片上传功能
- **数据统计**：提供销售数据统计和分析

## 🛠️ 技术栈

- **后端框架**：Node.js + Express
- **数据库**：MongoDB + Mongoose ODM
- **认证**：JWT (JSON Web Token)
- **文件上传**：Multer
- **密码加密**：bcryptjs
- **跨域处理**：CORS
- **环境变量**：dotenv

## 📁 项目结构

```
烧烤摆摊点单小程序/
├── api/                    # API相关代码
│   ├── config/            # 配置文件
│   │   ├── config.js      # 应用配置
│   │   └── database.js    # 数据库配置
│   ├── controllers/       # 控制器
│   │   ├── authController.js     # 认证控制器
│   │   ├── productController.js  # 菜品控制器
│   │   ├── orderController.js    # 订单控制器
│   │   ├── statsController.js    # 统计控制器
│   │   └── uploadController.js   # 上传控制器
│   ├── middleware/        # 中间件
│   │   ├── auth.js        # JWT认证中间件
│   │   └── validation.js  # 数据验证中间件
│   ├── models/           # 数据模型
│   │   ├── User.js       # 用户模型
│   │   ├── Merchant.js   # 商户模型
│   │   ├── Product.js    # 菜品模型
│   │   └── Order.js      # 订单模型
│   ├── routes/           # 路由
│   │   ├── auth.js       # 认证路由
│   │   ├── products.js   # 菜品路由
│   │   ├── orders.js     # 订单路由
│   │   ├── stats.js      # 统计路由
│   │   └── upload.js     # 上传路由
│   └── utils/            # 工具函数
├── uploads/              # 上传文件目录
├── app.js               # 主应用文件
├── package.json         # 项目依赖
├── .env                 # 环境变量
└── README.md           # 项目说明
```

## 🔧 本地开发

### 环境要求

- Node.js >= 14.0.0
- MongoDB >= 4.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <项目地址>
cd 烧烤摆摊点单小程序
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 文件为 `.env`，并配置以下变量：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/bbq-ordering

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

4. **启动MongoDB**

确保MongoDB服务正在运行：
```bash
# Windows
net start MongoDB

# macOS (使用Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

5. **启动开发服务器**
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动

### 测试API

项目包含测试文件，可以验证API功能：

```bash
# 运行API测试
node test-api.js

# 运行完整测试
node test-final.js
```

## 📡 API文档

### 认证相关

#### 商户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

#### 微信用户授权
```http
POST /api/auth/wechat
Content-Type: application/json

{
  "code": "微信授权码"
}
```

### 菜品管理

#### 获取菜品列表
```http
GET /api/products/:merchantId
```

#### 创建菜品（需要商户认证）
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "烤羊肉串",
  "price": 3.00,
  "description": "新鲜羊肉，香嫩可口",
  "category": "烤串类"
}
```

### 订单管理

#### 创建订单
```http
POST /api/orders
Content-Type: application/json

{
  "merchantId": "商户ID",
  "items": [
    {
      "productId": "菜品ID",
      "quantity": 2
    }
  ],
  "dineType": "dine-in",
  "customerInfo": {
    "nickname": "顾客昵称",
    "phone": "手机号"
  }
}
```

#### 更新订单状态（需要商户认证）
```http
PUT /api/orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

### 统计分析

#### 获取销售统计（需要商户认证）
```http
GET /api/stats/sales?period=daily&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

### 文件上传

#### 上传图片
```http
POST /api/upload
Content-Type: multipart/form-data

file: <图片文件>
```

## 🚀 部署方案

### 方案一：Railway部署

[Railway](https://railway.app) 是一个现代化的云平台，支持Node.js应用部署。

#### 部署步骤

1. **注册Railway账号**
   - 访问 [railway.app](https://railway.app)
   - 使用GitHub账号注册登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 连接你的GitHub仓库

3. **配置环境变量**
   
   在Railway项目设置中添加以下环境变量：
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRES_IN=7d
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bbq-ordering
   PORT=3000
   ```

4. **配置启动命令**
   
   Railway会自动检测package.json中的start脚本：
   ```json
   {
     "scripts": {
       "start": "node app.js"
     }
   }
   ```

5. **部署**
   - Railway会自动构建和部署
   - 部署完成后会提供一个公网URL

#### Railway优势
- 免费额度充足
- 自动HTTPS
- 简单易用
- 支持自定义域名

### 方案二：Render部署

[Render](https://render.com) 是另一个优秀的云平台，提供免费的Node.js托管。

#### 部署步骤

1. **注册Render账号**
   - 访问 [render.com](https://render.com)
   - 使用GitHub账号注册登录

2. **创建Web Service**
   - 点击 "New +" → "Web Service"
   - 连接GitHub仓库
   - 选择你的项目仓库

3. **配置服务**
   ```
   Name: bbq-ordering-api
   Environment: Node
   Build Command: npm install
   Start Command: node app.js
   ```

4. **配置环境变量**
   
   在Environment Variables中添加：
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRES_IN=7d
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bbq-ordering
   ```

5. **部署**
   - 点击 "Create Web Service"
   - Render会自动构建和部署

#### Render优势
- 免费计划可用
- 自动SSL证书
- 持续部署
- 详细的日志

### 方案三：MongoDB Atlas配置

#### 创建MongoDB Atlas集群

1. **注册MongoDB Atlas**
   - 访问 [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - 注册免费账号

2. **创建集群**
   - 选择免费的M0集群
   - 选择云服务商和地区
   - 创建集群（需要几分钟）

3. **配置数据库访问**
   - 创建数据库用户
   - 设置用户名和密码
   - 配置IP白名单（0.0.0.0/0 允许所有IP）

4. **获取连接字符串**
   - 点击 "Connect"
   - 选择 "Connect your application"
   - 复制连接字符串
   - 格式：`mongodb+srv://username:password@cluster.mongodb.net/database`

5. **初始化数据**
   
   连接到数据库后，可以手动创建初始商户：
   ```javascript
   // 在MongoDB Compass或Atlas界面中执行
   db.merchants.insertOne({
     username: "admin",
     password: "$2b$10$hashed_password", // 需要先加密
     name: "烧烤摊示例店",
     description: "正宗烧烤，美味可口",
     phone: "13800138000",
     address: "某某街道某某号",
     isActive: true,
     createdAt: new Date()
   });
   ```

## 🔒 安全配置

### 生产环境安全检查

1. **JWT密钥**
   - 使用强随机密钥
   - 定期更换密钥
   - 不要在代码中硬编码

2. **数据库安全**
   - 使用强密码
   - 限制IP访问
   - 启用数据库认证

3. **HTTPS**
   - 生产环境必须使用HTTPS
   - 配置SSL证书

4. **环境变量**
   - 敏感信息存储在环境变量中
   - 不要提交.env文件到版本控制

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```
   Error: MongoNetworkError
   ```
   - 检查MongoDB服务是否启动
   - 验证连接字符串是否正确
   - 检查网络连接

2. **JWT认证失败**
   ```
   Error: JsonWebTokenError
   ```
   - 检查JWT_SECRET是否配置
   - 验证token格式是否正确
   - 检查token是否过期

3. **文件上传失败**
   ```
   Error: ENOENT: no such file or directory
   ```
   - 检查uploads目录是否存在
   - 验证文件权限
   - 检查磁盘空间

### 日志查看

```bash
# 查看应用日志
npm start

# 查看详细错误信息
NODE_ENV=development npm start
```

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看项目文档
2. 检查环境变量配置
3. 查看服务器日志
4. 联系技术支持

## 📄 许可证

MIT License

---

**祝您部署顺利！🎉**