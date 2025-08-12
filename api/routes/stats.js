import express from 'express';
import rateLimit from 'express-rate-limit';
import { query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateMerchant, authenticateUser } from '../middleware/auth.js';
import {
  getSalesStats,
  getOrderStats,
  getMerchantOverview,
  getUserStats
} from '../controllers/statsController.js';

const router = express.Router();

// 统计查询限流配置
const statsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 最多50次查询
  message: {
    success: false,
    message: '统计查询过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 验证规则
const periodValidation = [
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'week', 'month', 'year'])
    .withMessage('时间周期必须是: today, yesterday, week, month, year 之一'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确，请使用ISO8601格式')
    .custom((value, { req }) => {
      if (value && !req.query.endDate) {
        throw new Error('指定开始日期时必须同时指定结束日期');
      }
      return true;
    }),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确，请使用ISO8601格式')
    .custom((value, { req }) => {
      if (value && !req.query.startDate) {
        throw new Error('指定结束日期时必须同时指定开始日期');
      }
      if (value && req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('结束日期必须晚于开始日期');
      }
      return true;
    })
];

// ==================== 商户统计 ====================

/**
 * @route GET /api/stats/sales
 * @desc 获取销售统计
 * @access Private (商户)
 */
router.get('/sales',
  statsLimiter,
  authenticateMerchant,
  periodValidation,
  validateRequest,
  getSalesStats
);

/**
 * @route GET /api/stats/orders
 * @desc 获取订单统计
 * @access Private (商户)
 */
router.get('/orders',
  statsLimiter,
  authenticateMerchant,
  periodValidation,
  validateRequest,
  getOrderStats
);

/**
 * @route GET /api/stats/overview
 * @desc 获取商户概览统计
 * @access Private (商户)
 */
router.get('/overview',
  statsLimiter,
  authenticateMerchant,
  getMerchantOverview
);

// ==================== 用户统计 ====================

/**
 * @route GET /api/stats/users
 * @desc 获取用户统计（仅限管理员查看）
 * @access Private (管理员)
 */
router.get('/users',
  statsLimiter,
  authenticateMerchant, // 暂时使用商户认证，实际应该是管理员认证
  periodValidation,
  validateRequest,
  getUserStats
);

// ==================== 实时统计 ====================

/**
 * @route GET /api/stats/realtime
 * @desc 获取实时统计数据
 * @access Private (商户)
 */
router.get('/realtime',
  statsLimiter,
  authenticateMerchant,
  async (req, res) => {
    try {
      const merchantId = req.merchantId;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 导入Order模型
      const { default: Order } = await import('../models/Order.js');
      
      // 今日实时数据
      const realtimeStats = await Order.aggregate([
        {
          $match: {
            merchantId,
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            preparingOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'preparing'] }, 1, 0]
              }
            },
            readyOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'ready'] }, 1, 0]
              }
            },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        }
      ]);
      
      // 最近1小时订单
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const recentOrders = await Order.find({
        merchantId,
        createdAt: { $gte: oneHourAgo }
      })
      .select('orderNumber status totalAmount createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
      
      // 当前排队情况
      const queueInfo = await Order.find({
        merchantId,
        status: { $in: ['pending', 'confirmed', 'preparing'] }
      })
      .select('queueNumber orderNumber status createdAt')
      .sort({ queueNumber: 1 });
      
      const stats = realtimeStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        completedOrders: 0
      };
      
      res.json({
        success: true,
        data: {
          timestamp: now,
          today: {
            totalOrders: stats.totalOrders,
            totalRevenue: Number(stats.totalRevenue.toFixed(2)),
            ordersByStatus: {
              pending: stats.pendingOrders,
              preparing: stats.preparingOrders,
              ready: stats.readyOrders,
              completed: stats.completedOrders
            }
          },
          recentOrders: recentOrders.map(order => ({
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt
          })),
          queue: {
            totalInQueue: queueInfo.length,
            orders: queueInfo.map(order => ({
              queueNumber: order.queueNumber,
              orderNumber: order.orderNumber,
              status: order.status,
              waitingTime: Math.floor((now - order.createdAt) / (1000 * 60)) // 分钟
            }))
          }
        }
      });
    } catch (error) {
      console.error('获取实时统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取实时统计失败'
      });
    }
  }
);

// ==================== 导出统计 ====================

/**
 * @route GET /api/stats/export
 * @desc 导出统计数据
 * @access Private (商户)
 */
router.get('/export',
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1小时
    max: 5, // 最多5次导出
    message: {
      success: false,
      message: '导出操作过于频繁，请稍后再试'
    }
  }),
  authenticateMerchant,
  [
    query('type')
      .isIn(['sales', 'orders', 'products'])
      .withMessage('导出类型必须是: sales, orders, products 之一'),
    ...periodValidation
  ],
  validateRequest,
  async (req, res) => {
    try {
      const merchantId = req.merchantId;
      const { type, period = 'month', startDate, endDate } = req.query;
      
      // 确定时间范围
      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        };
      } else {
        const getDateRange = (period) => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          switch (period) {
            case 'today':
              return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'week':
              return { start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
            case 'month':
              return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: now };
            default:
              return { start: today, end: now };
          }
        };
        dateRange = getDateRange(period);
      }
      
      let exportData = [];
      
      if (type === 'sales') {
        // 导入Order模型
        const { default: Order } = await import('../models/Order.js');
        
        exportData = await Order.find({
          merchantId,
          status: { $in: ['completed', 'ready'] },
          createdAt: {
            $gte: dateRange.start,
            $lt: dateRange.end
          }
        })
        .select('orderNumber totalAmount status createdAt items')
        .populate('items.productId', 'name price')
        .sort({ createdAt: -1 });
      } else if (type === 'orders') {
        const { default: Order } = await import('../models/Order.js');
        
        exportData = await Order.find({
          merchantId,
          createdAt: {
            $gte: dateRange.start,
            $lt: dateRange.end
          }
        })
        .select('orderNumber status totalAmount diningType createdAt customerInfo')
        .sort({ createdAt: -1 });
      } else if (type === 'products') {
        const { default: Product } = await import('../models/Product.js');
        
        exportData = await Product.find({ merchantId })
        .select('name price category isAvailable stock salesCount createdAt');
      }
      
      res.json({
        success: true,
        data: {
          type,
          period,
          dateRange,
          exportData,
          totalRecords: exportData.length,
          exportedAt: new Date()
        }
      });
    } catch (error) {
      console.error('导出统计数据错误:', error);
      res.status(500).json({
        success: false,
        message: '导出统计数据失败'
      });
    }
  }
);

// ==================== 健康检查 ====================

/**
 * @route GET /api/stats/health
 * @desc 统计服务健康检查
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '统计服务运行正常',
    timestamp: new Date().toISOString(),
    service: 'stats',
    version: '1.0.0'
  });
});

export default router;