import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入配置和数据库连接
import config from './api/config/config.js';
import './api/config/database.js';

// 导入路由
import authRoutes from './api/routes/auth.js';
import productRoutes from './api/routes/products.js';
import orderRoutes from './api/routes/orders.js';

// 导入中间件
import { rateLimit } from './api/middleware/auth.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// ==================== 基础中间件配置 ====================

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS配置
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求日志
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 全局限流
app.use(rateLimit(1000, 15 * 60 * 1000)); // 15分钟内最多1000次请求

// ==================== 路由配置 ====================

// API根路径
const API_PREFIX = '/api/v1';

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '烧烤摆摊点单小程序API服务运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime()
  });
});

// API信息路由
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '烧烤摆摊点单小程序API',
    version: '1.0.0',
    documentation: {
      auth: `${req.protocol}://${req.get('host')}${API_PREFIX}/auth`,
      products: `${req.protocol}://${req.get('host')}${API_PREFIX}/products`,
      orders: `${req.protocol}://${req.get('host')}${API_PREFIX}/orders`
    },
    endpoints: {
      health: '/health',
      auth: {
        wechatLogin: 'POST /api/v1/auth/wechat/login',
        merchantLogin: 'POST /api/v1/auth/merchant/login',
        merchantRegister: 'POST /api/v1/auth/merchant/register',
        refreshToken: 'POST /api/v1/auth/refresh',
        userProfile: 'GET /api/v1/auth/user/profile',
        merchantProfile: 'GET /api/v1/auth/merchant/profile'
      },
      products: {
        create: 'POST /api/v1/products',
        list: 'GET /api/v1/products/merchant/:merchantId',
        detail: 'GET /api/v1/products/:id',
        update: 'PUT /api/v1/products/:id',
        delete: 'DELETE /api/v1/products/:id',
        categories: 'GET /api/v1/products/merchant/:merchantId/categories',
        search: 'GET /api/v1/products/merchant/:merchantId/search'
      },
      orders: {
        create: 'POST /api/v1/orders',
        list: 'GET /api/v1/orders/my',
        detail: 'GET /api/v1/orders/:id',
        updateStatus: 'PATCH /api/v1/orders/:id/status',
        cancel: 'PATCH /api/v1/orders/:id/cancel',
        queue: 'GET /api/v1/orders/queue/:merchantId',
        stats: 'GET /api/v1/orders/merchant/stats'
      }
    }
  });
});

// 注册API路由
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/upload`, (await import('./api/routes/upload.js')).default);
app.use(`${API_PREFIX}/stats`, (await import('./api/routes/stats.js')).default);

// ==================== 错误处理中间件 ====================

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('全局错误处理:', error);
  
  // Mongoose验证错误
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors
    });
  }
  
  // Mongoose重复键错误
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field}已存在`,
      field
    });
  }
  
  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期'
    });
  }
  
  // 语法错误
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: '请求体格式错误'
    });
  }
  
  // 默认服务器错误
  const statusCode = error.statusCode || error.status || 500;
  const message = config.nodeEnv === 'production' 
    ? '服务器内部错误' 
    : error.message || '服务器内部错误';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && {
      stack: error.stack,
      error: error
    })
  });
});

// ==================== 服务器启动 ====================

const PORT = config.port || 3000;

// 优雅关闭处理
const gracefulShutdown = (signal) => {
  console.log(`\n收到 ${signal} 信号，开始优雅关闭服务器...`);
  
  server.close((err) => {
    if (err) {
      console.error('服务器关闭时发生错误:', err);
      process.exit(1);
    }
    
    console.log('服务器已关闭');
    
    // 关闭数据库连接
    import('mongoose').then(mongoose => {
      mongoose.default.connection.close(() => {
        console.log('数据库连接已关闭');
        process.exit(0);
      });
    });
  });
};

// 启动服务器
const server = app.listen(PORT, () => {
  console.log('\n🔥 烧烤摆摊点单小程序API服务器启动成功!');
  console.log(`🌐 服务器地址: http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔧 运行环境: ${config.nodeEnv}`);
  console.log(`📊 数据库: ${config.mongodb.uri.replace(/\/\/.*@/, '//***:***@')}`);
  console.log('\n🚀 服务器已准备就绪，等待请求...');
});

// 监听进程信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

export default app;