import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getQueueInfo
} from '../controllers/orderController.js';
import {
  authenticateUser,
  authenticateMerchant,
  optionalAuth,
  rateLimit
} from '../middleware/auth.js';

const router = express.Router();

// 验证错误处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: errors.array()
    });
  }
  next();
};

// 创建订单验证规则
const createOrderValidation = [
  body('merchantId')
    .isMongoId()
    .withMessage('无效的商户ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('订单商品不能为空'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('无效的商品ID'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('商品数量必须在1-99之间'),
  body('items.*.note')
    .optional()
    .isLength({ max: 100 })
    .withMessage('商品备注最多100个字符'),
  body('dineType')
    .isIn(['dine-in', 'takeaway'])
    .withMessage('就餐方式必须是dine-in或takeaway'),
  body('customerInfo.nickname')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度应在1-50个字符之间')
    .custom((value, { req }) => {
      // 如果用户已登录，跳过验证（后端会使用真实用户信息）
      if (req.userId) {
        return true;
      }
      return true;
    }),
  body('customerInfo.phone')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      // 如果用户已登录，跳过验证（后端会使用真实用户信息）
      if (req.userId) {
        return true;
      }
      // 如果用户未登录且提供了手机号，验证格式
      if (value && !/^1[3-9]\d{9}$/.test(value)) {
        throw new Error('请输入有效的手机号码');
      }
      return true;
    }),
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('订单备注最多200个字符')
];

// 更新订单状态验证规则
const updateStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的订单ID'),
  body('status')
    .isIn(['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'])
    .withMessage('无效的订单状态'),
  body('reason')
    .optional()
    .isLength({ max: 100 })
    .withMessage('原因说明最多100个字符')
];

// 取消订单验证规则
const cancelOrderValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的订单ID'),
  body('reason')
    .optional()
    .isLength({ max: 100 })
    .withMessage('取消原因最多100个字符')
];

// 查询参数验证
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'])
    .withMessage('无效的订单状态'),
  query('dineType')
    .optional()
    .isIn(['dine-in', 'takeaway'])
    .withMessage('无效的就餐方式'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'totalAmount', 'queueNumber'])
    .withMessage('排序字段无效'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是asc或desc')
];

// ==================== 订单创建和查询路由 ====================

// 创建订单（需要用户登录）
router.post('/', 
  rateLimit(100, 60 * 60 * 1000), // 1小时内最多100次请求
  authenticateUser, // 要求用户登录
  createOrderValidation,
  handleValidationErrors,
  createOrder
);

// 获取订单列表（需要认证）
router.get('/', 
  authenticateUser,
  queryValidation,
  handleValidationErrors,
  getOrders
);

// 获取订单列表（用户查看自己的订单）
router.get('/my', 
  authenticateUser,
  queryValidation,
  handleValidationErrors,
  getOrders
);

// 获取单个订单详情
router.get('/:id', 
  param('id').isMongoId().withMessage('无效的订单ID'),
  handleValidationErrors,
  optionalAuth,
  getOrder
);

// 取消订单（用户取消自己的订单）
router.patch('/:id/cancel', 
  authenticateUser,
  cancelOrderValidation,
  handleValidationErrors,
  cancelOrder
);

// ==================== 商户订单管理路由 ====================

// 获取商户订单列表
router.get('/merchant/list', 
  authenticateMerchant,
  queryValidation,
  handleValidationErrors,
  getOrders
);

// 更新订单状态（商户操作）
router.patch('/:id/status', 
  authenticateMerchant,
  updateStatusValidation,
  handleValidationErrors,
  updateOrderStatus
);

// 商户取消订单
router.patch('/:id/merchant-cancel', 
  authenticateMerchant,
  cancelOrderValidation,
  handleValidationErrors,
  cancelOrder
);

// 获取订单统计（商户专用）
router.get('/merchant/stats', 
  authenticateMerchant,
  getOrderStats
);

// ==================== 公开查询路由 ====================

// 获取商户排队信息（公开）
router.get('/queue/:merchantId', 
  param('merchantId').isMongoId().withMessage('无效的商户ID'),
  handleValidationErrors,
  getQueueInfo
);

// ==================== 订单状态快捷操作路由 ====================

// 确认订单
router.patch('/:id/confirm', 
  authenticateMerchant,
  param('id').isMongoId().withMessage('无效的订单ID'),
  handleValidationErrors,
  (req, res, next) => {
    req.body.status = 'confirmed';
    next();
  },
  updateOrderStatus
);

// 开始制作
router.patch('/:id/cooking', 
  authenticateMerchant,
  param('id').isMongoId().withMessage('无效的订单ID'),
  handleValidationErrors,
  (req, res, next) => {
    req.body.status = 'cooking';
    next();
  },
  updateOrderStatus
);

// 制作完成
router.patch('/:id/ready', 
  authenticateMerchant,
  param('id').isMongoId().withMessage('无效的订单ID'),
  handleValidationErrors,
  (req, res, next) => {
    req.body.status = 'ready';
    next();
  },
  updateOrderStatus
);

// 订单完成
router.patch('/:id/complete', 
  authenticateMerchant,
  param('id').isMongoId().withMessage('无效的订单ID'),
  handleValidationErrors,
  (req, res, next) => {
    req.body.status = 'completed';
    next();
  },
  updateOrderStatus
);

// ==================== 订单查询辅助路由 ====================

// 根据订单号查询订单
router.get('/number/:orderNumber', 
  param('orderNumber')
    .matches(/^BBQ\d+$/)
    .withMessage('无效的订单号格式'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { orderNumber } = req.params;
      
      const order = await Order.findOne({ orderNumber })
        .populate('merchantId', 'name address phone')
        .populate('customerId', 'nickname avatar');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      res.json({
        success: true,
        data: {
          order
        }
      });
      
    } catch (error) {
      console.error('查询订单错误:', error);
      res.status(500).json({
        success: false,
        message: '查询订单失败'
      });
    }
  }
);

// 获取今日订单概览（商户专用）
router.get('/merchant/today', 
  authenticateMerchant,
  async (req, res) => {
    try {
      const merchantId = req.merchantId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const orders = await Order.find({
        merchantId,
        createdAt: { $gte: today, $lt: tomorrow }
      })
      .sort({ createdAt: -1 })
      .select('orderNumber status queueNumber totalAmount dineType createdAt');
      
      res.json({
        success: true,
        data: {
          orders,
          count: orders.length
        }
      });
      
    } catch (error) {
      console.error('获取今日订单错误:', error);
      res.status(500).json({
        success: false,
        message: '获取今日订单失败'
      });
    }
  }
);

// ==================== 健康检查路由 ====================

// API健康检查
router.get('/health/check', (req, res) => {
  res.json({
    success: true,
    message: '订单服务运行正常',
    timestamp: new Date().toISOString()
  });
});

export default router;