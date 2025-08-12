import express from 'express';

/**
 * 简化测试服务器 - 不依赖MongoDB
 * 使用内存存储进行API测试
 */

const app = express();
const PORT = process.env.PORT || 3001;

// 内存存储
const storage = {
  merchants: new Map(),
  users: new Map(),
  products: new Map(),
  orders: new Map(),
  nextId: 1
};

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS处理
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 简单的JWT模拟
const generateToken = (payload) => {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const verifyToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    throw new Error('Invalid token');
  }
};

// 认证中间件
const authenticateMerchant = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '请提供有效的认证令牌' });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const merchant = storage.merchants.get(decoded.merchantId);
    
    if (!merchant) {
      return res.status(401).json({ success: false, message: '商户不存在' });
    }
    
    req.merchant = merchant;
    req.merchantId = merchant.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '认证失败' });
  }
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '烧烤摆摊点单小程序API服务运行正常',
    timestamp: new Date().toISOString(),
    environment: 'test'
  });
});

// API信息
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '烧烤摆摊点单小程序API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /api/v1/auth/*',
      products: 'GET|POST|PUT|DELETE /api/v1/products/*',
      orders: 'GET|POST|PUT /api/v1/orders/*'
    }
  });
});

// 商户注册
app.post('/api/v1/auth/merchant/register', (req, res) => {
  const { username, password, name, phone, address, description } = req.body;
  
  // 简单验证
  if (!username || username.length < 3 || username.length > 20) {
    return res.status(400).json({
      success: false,
      message: '用户名长度应在3-20个字符之间'
    });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: '密码长度至少6个字符'
    });
  }
  
  // 检查用户名是否已存在
  for (const merchant of storage.merchants.values()) {
    if (merchant.username === username) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
  }
  
  // 创建商户
  const merchantId = storage.nextId++;
  const merchant = {
    id: merchantId,
    username,
    name,
    phone,
    address,
    description,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  storage.merchants.set(merchantId, merchant);
  
  // 生成令牌
  const token = generateToken({ merchantId, username });
  
  res.json({
    success: true,
    message: '商户注册成功',
    data: {
      merchant: { ...merchant, password: undefined },
      token
    }
  });
});

// 商户登录
app.post('/api/v1/auth/merchant/login', (req, res) => {
  const { username, password } = req.body;
  
  // 查找商户
  let merchant = null;
  for (const m of storage.merchants.values()) {
    if (m.username === username) {
      merchant = m;
      break;
    }
  }
  
  if (!merchant) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
  
  // 生成令牌
  const token = generateToken({ merchantId: merchant.id, username });
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      merchant: { ...merchant, password: undefined },
      token
    }
  });
});

// 获取商户信息
app.get('/api/v1/auth/merchant/profile', authenticateMerchant, (req, res) => {
  res.json({
    success: true,
    data: {
      merchant: req.merchant
    }
  });
});

// 创建菜品
app.post('/api/v1/products', authenticateMerchant, (req, res) => {
  const { name, price, description, category, stock } = req.body;
  
  const productId = storage.nextId++;
  const product = {
    _id: productId,
    name,
    price,
    description,
    category,
    stock,
    merchantId: req.merchantId,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  storage.products.set(productId, product);
  
  res.json({
    success: true,
    message: '菜品创建成功',
    data: { product }
  });
});

// 获取菜品列表
app.get('/api/v1/products', authenticateMerchant, (req, res) => {
  const products = Array.from(storage.products.values())
    .filter(p => p.merchantId === req.merchantId);
  
  res.json({
    success: true,
    data: {
      products,
      total: products.length
    }
  });
});

// 统计概览
app.get('/api/v1/stats/overview', authenticateMerchant, (req, res) => {
  const merchantProducts = Array.from(storage.products.values())
    .filter(p => p.merchantId === req.merchantId);
  
  const merchantOrders = Array.from(storage.orders.values())
    .filter(o => o.merchantId === req.merchantId);
  
  res.json({
    success: true,
    data: {
      today: {
        orders: merchantOrders.length,
        revenue: merchantOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      },
      month: {
        orders: merchantOrders.length,
        revenue: merchantOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      },
      products: {
        total: merchantProducts.length,
        active: merchantProducts.filter(p => p.status === 'active').length
      }
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🔥 测试服务器启动成功!`);
  console.log(`🌐 服务器地址: http://localhost:${PORT}`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
  console.log(`📊 存储状态: 内存模式`);
  console.log(`\n🚀 服务器已准备就绪，等待请求...`);
});

export default app;