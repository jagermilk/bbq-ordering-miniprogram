import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Merchant from '../models/Merchant.js';
import User from '../models/User.js';

/**
 * 统计分析控制器
 * 提供销售统计、订单统计、商户统计等功能
 */

// 获取日期范围
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekStart,
        end: now
      };
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: monthStart,
        end: now
      };
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return {
        start: yearStart,
        end: now
      };
    default:
      return {
        start: today,
        end: now
      };
  }
};

// 获取销售统计
export const getSalesStats = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { period = 'today', startDate, endDate } = req.query;
    
    // 确定时间范围
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      dateRange = getDateRange(period);
    }
    
    // 基础查询条件
    const baseQuery = {
      merchantId,
      status: { $in: ['completed', 'ready'] },
      createdAt: {
        $gte: dateRange.start,
        $lt: dateRange.end
      }
    };
    
    // 销售统计聚合
    const salesStats = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalItems: {
            $sum: {
              $sum: '$items.quantity'
            }
          }
        }
      }
    ]);
    
    // 按日期分组的销售趋势
    const salesTrend = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          orders: 1,
          revenue: 1,
          _id: 0
        }
      }
    ]);
    
    // 热销商品统计
    const topProducts = await Order.aggregate([
      { $match: baseQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productPrice: '$product.price',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);
    
    // 订单状态分布
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          merchantId,
          createdAt: {
            $gte: dateRange.start,
            $lt: dateRange.end
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 就餐方式统计
    const diningTypeStats = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$diningType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const stats = salesStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0
    };
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        summary: {
          totalOrders: stats.totalOrders,
          totalRevenue: Number(stats.totalRevenue.toFixed(2)),
          averageOrderValue: Number(stats.averageOrderValue?.toFixed(2) || 0),
          totalItems: stats.totalItems
        },
        salesTrend,
        topProducts,
        orderStatusStats,
        diningTypeStats
      }
    });
  } catch (error) {
    console.error('获取销售统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取销售统计失败'
    });
  }
};

// 获取订单统计
export const getOrderStats = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { period = 'today' } = req.query;
    
    const dateRange = getDateRange(period);
    
    // 基础查询条件
    const baseQuery = {
      merchantId,
      createdAt: {
        $gte: dateRange.start,
        $lt: dateRange.end
      }
    };
    
    // 订单统计
    const orderStats = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // 按小时分组的订单分布
    const hourlyStats = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          hour: '$_id',
          orders: 1,
          revenue: 1,
          _id: 0
        }
      }
    ]);
    
    // 平均制作时间统计
    const preparationTimeStats = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: 'completed',
          actualCompletionTime: { $exists: true }
        }
      },
      {
        $project: {
          preparationTime: {
            $divide: [
              { $subtract: ['$actualCompletionTime', '$createdAt'] },
              1000 * 60 // 转换为分钟
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$preparationTime' },
          minTime: { $min: '$preparationTime' },
          maxTime: { $max: '$preparationTime' }
        }
      }
    ]);
    
    // 取消订单统计
    const cancelledStats = await Order.aggregate([
      {
        $match: {
          ...baseQuery,
          status: 'cancelled'
        }
      },
      {
        $group: {
          _id: '$cancelReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // 排队统计
    const queueStats = await Order.aggregate([
      {
        $match: {
          merchantId,
          status: { $in: ['pending', 'confirmed', 'preparing'] }
        }
      },
      {
        $group: {
          _id: null,
          totalInQueue: { $sum: 1 },
          averageQueueNumber: { $avg: '$queueNumber' }
        }
      }
    ]);
    
    const prepTime = preparationTimeStats[0] || {
      averageTime: 0,
      minTime: 0,
      maxTime: 0
    };
    
    const queue = queueStats[0] || {
      totalInQueue: 0,
      averageQueueNumber: 0
    };
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        orderStats,
        hourlyStats,
        preparationTime: {
          average: Number(prepTime.averageTime?.toFixed(1) || 0),
          min: Number(prepTime.minTime?.toFixed(1) || 0),
          max: Number(prepTime.maxTime?.toFixed(1) || 0)
        },
        cancelledStats,
        queueStats: {
          totalInQueue: queue.totalInQueue,
          averageQueueNumber: Number(queue.averageQueueNumber?.toFixed(1) || 0)
        }
      }
    });
  } catch (error) {
    console.error('获取订单统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单统计失败'
    });
  }
};

// 获取商户概览统计
export const getMerchantOverview = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    
    // 今日统计
    const todayRange = getDateRange('today');
    const todayStats = await Order.aggregate([
      {
        $match: {
          merchantId,
          createdAt: {
            $gte: todayRange.start,
            $lt: todayRange.end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // 本月统计
    const monthRange = getDateRange('month');
    const monthStats = await Order.aggregate([
      {
        $match: {
          merchantId,
          status: { $in: ['completed', 'ready'] },
          createdAt: {
            $gte: monthRange.start,
            $lt: monthRange.end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // 商品统计
    const productStats = await Product.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          availableProducts: {
            $sum: {
              $cond: ['$isAvailable', 1, 0]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $lte: ['$stock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // 用户统计（今日新增）
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: todayRange.start,
            $lt: todayRange.end
          }
        }
      },
      {
        $group: {
          _id: null,
          newUsers: { $sum: 1 }
        }
      }
    ]);
    
    // 获取商户信息
    const merchant = await Merchant.findById(merchantId).select('totalOrders totalRevenue averageRating');
    
    const today = todayStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      completedOrders: 0,
      pendingOrders: 0
    };
    
    const month = monthStats[0] || {
      totalOrders: 0,
      totalRevenue: 0
    };
    
    const products = productStats[0] || {
      totalProducts: 0,
      availableProducts: 0,
      outOfStockProducts: 0
    };
    
    const users = userStats[0] || {
      newUsers: 0
    };
    
    res.json({
      success: true,
      data: {
        today: {
          orders: today.totalOrders,
          revenue: Number(today.totalRevenue.toFixed(2)),
          completedOrders: today.completedOrders,
          pendingOrders: today.pendingOrders
        },
        month: {
          orders: month.totalOrders,
          revenue: Number(month.totalRevenue.toFixed(2))
        },
        products: {
          total: products.totalProducts,
          available: products.availableProducts,
          outOfStock: products.outOfStockProducts
        },
        users: {
          newToday: users.newUsers
        },
        merchant: {
          totalOrders: merchant?.totalOrders || 0,
          totalRevenue: merchant?.totalRevenue || 0,
          averageRating: merchant?.averageRating || 0
        }
      }
    });
  } catch (error) {
    console.error('获取商户概览错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商户概览失败'
    });
  }
};

// 获取用户统计（仅限管理员）
export const getUserStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dateRange = getDateRange(period);
    
    // 用户注册统计
    const userRegistrationStats = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: dateRange.start,
            $lt: dateRange.end
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // 活跃用户统计
    const activeUserStats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: dateRange.start,
            $lt: dateRange.end
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: null,
          activeUsers: { $sum: 1 },
          averageOrdersPerUser: { $avg: '$orderCount' },
          averageSpentPerUser: { $avg: '$totalSpent' }
        }
      }
    ]);
    
    const activeStats = activeUserStats[0] || {
      activeUsers: 0,
      averageOrdersPerUser: 0,
      averageSpentPerUser: 0
    };
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        registrationTrend: userRegistrationStats,
        activeUsers: {
          total: activeStats.activeUsers,
          averageOrders: Number(activeStats.averageOrdersPerUser?.toFixed(1) || 0),
          averageSpent: Number(activeStats.averageSpentPerUser?.toFixed(2) || 0)
        }
      }
    });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败'
    });
  }
};

export default {
  getSalesStats,
  getOrderStats,
  getMerchantOverview,
  getUserStats
};