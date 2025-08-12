import dotenv from 'dotenv';

dotenv.config();

/**
 * 应用配置
 */
const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bbq-ordering-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 10000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'your-wechat-app-id',
    appSecret: process.env.WECHAT_APP_SECRET || 'your-wechat-app-secret'
  },
  
  // CORS配置
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true
  },
  
  // 分页配置
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },
  
  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 15分钟内最多100个请求
  }
};

export default config;