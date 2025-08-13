import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * 智能环境检测和配置加载
 */
const loadEnvironmentConfig = () => {
  // 检测运行环境
  const detectEnvironment = () => {
    // 优先使用 NODE_ENV
    if (process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    
    // 检测部署平台
    const isRender = !!process.env.RENDER;
    const isVercel = !!process.env.VERCEL;
    const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
    const isHeroku = !!process.env.DYNO;
    const isNetlify = !!process.env.NETLIFY;
    
    // 检测端口
    const port = parseInt(process.env.PORT) || 3000;
    const isProductionPort = port === 80 || port === 443 || port > 8000;
    
    // 如果检测到部署环境，返回 production
    if (isRender || isVercel || isRailway || isHeroku || isNetlify || isProductionPort) {
      return 'production';
    }
    
    // 默认为开发环境
    return 'development';
  };
  
  const environment = detectEnvironment();
  const envFile = `.env.${environment}`;
  const envPath = path.resolve(process.cwd(), envFile);
  
  console.log(`🔍 检测到环境: ${environment}`);
  console.log(`📁 尝试加载配置文件: ${envFile}`);
  
  // 检查环境特定配置文件是否存在
  if (fs.existsSync(envPath)) {
    console.log(`✅ 找到环境配置文件: ${envFile}`);
    dotenv.config({ path: envPath });
  } else {
    console.log(`⚠️  环境配置文件不存在: ${envFile}`);
    console.log(`📁 回退到默认配置文件: .env`);
    dotenv.config(); // 回退到默认 .env 文件
  }
  
  // 确保 NODE_ENV 被正确设置
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = environment;
  }
  
  return environment;
};

// 加载环境配置
const currentEnvironment = loadEnvironmentConfig();

/**
 * 应用配置
 */
const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库配置 - 从环境文件加载
  database: {
    uri: (() => {
      const dbUri = process.env.MONGODB_URI;
      
      if (!dbUri) {
        if (currentEnvironment === 'production') {
          throw new Error('生产环境必须在 .env.production 文件中设置 MONGODB_URI');
        }
        throw new Error(`${currentEnvironment} 环境的配置文件中缺少 MONGODB_URI`);
      }
      
      console.log(`📊 当前环境: ${currentEnvironment}`);
      console.log(`📊 数据库连接: ${dbUri.replace(/\/\/.*@/, '//***:***@')}`);
      
      return dbUri;
    })(),
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