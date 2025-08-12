import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Merchant from '../models/Merchant.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * 订单管理控制器
 * 处理订单的创建、查询、状态更新等操作
 */

// 创建订单
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      merchantId,
      items,
      dineType,
      customerInfo,
      note
    } = req.body;
    
    // 验证必填字段
    if (!merchantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的商户ID和订单商品'
      });
    }
    
    if (!dineType || !['dine-in', 'takeaway'].includes(dineType)) {
      return res.status(400).json({
        success: false,
        message: '请选择有效的就餐方式'
      });
    }
    
    // 验证商户是否存在且营业中
    const merchant = await Merchant.findById(merchantId).session(session);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: '商户不存在'
      });
    }
    
    if (!merchant.isOpen) {
      return res.status(400).json({
        success: false,
        message: '商户暂停营业'
      });
    }
    
    // 验证营业时间
    if (!merchant.isInBusinessHours()) {
      return res.status(400).json({
        success: false,
        message: '当前不在营业时间内'
      });
    }
    
    // 验证商品并计算总金额
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const { productId, quantity, note: itemNote } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: '商品信息不完整'
        });
      }
      
      // 查找商品
      const product = await Product.findOne({
        _id: productId,
        merchantId,
        isAvailable: true
      }).session(session);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `商品"${productId}"不存在或已下架`
        });
      }
      
      // 检查库存
      if (!product.checkStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: `商品"${product.name}"库存不足`
        });
      }
      
      // 减少库存
      if (!product.reduceStock(quantity)) {
        return res.status(400).json({
          success: false,
          message: `商品"${product.name}"库存不足`
        });
      }
      
      await product.save({ session });
      
      const subtotal = product.price * quantity;
      totalAmount += subtotal;
      
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal,
        image: product.image,
        note: itemNote || ''
      });
    }
    
    // 生成排队号
    const queueNumber = await Order.generateQueueNumber(merchantId);
    
    // 创建订单
    const order = new Order({
      merchantId,
      customerId: req.userId || null,
      status: 'pending',
      dineType,
      totalAmount,
      queueNumber,
      customerInfo: customerInfo || {},
      items: orderItems,
      note: note || ''
    });
    
    // 如果用户已登录，获取用户信息
    if (req.userId) {
      const user = await User.findById(req.userId).session(session);
      if (user) {
        order.customerInfo = {
          nickname: user.nickname,
          phone: user.phone,
          avatar: user.avatar
        };
      }
    }
    
    await order.save({ session });
    
    // 更新商户统计信息
    merchant.stats.totalOrders += 1;
    await merchant.save({ session });
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          queueNumber: order.queueNumber,
          totalAmount: order.totalAmount,
          dineType: order.dineType,
          items: order.items,
          createdAt: order.createdAt
        }
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败，请稍后重试'
    });
  } finally {
    session.endSession();
  }
};

// 获取订单列表
export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dineType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // 构建查询条件
    const query = {};
    
    // 根据用户类型设置查询条件
    if (req.merchantId) {
      // 商户查看自己的订单
      query.merchantId = req.merchantId;
    } else if (req.userId) {
      // 用户查看自己的订单
      query.customerId = req.userId;
    } else {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    
    if (status) {
      query.status = status;
    }
    
    if (dineType) {
      query.dineType = dineType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // 构建排序条件
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询订单
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('merchantId', 'name address phone')
        .populate('customerId', 'nickname avatar phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
};

// 获取单个订单详情
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单ID'
      });
    }
    
    const order = await Order.findById(id)
      .populate('merchantId', 'name address phone businessHours')
      .populate('customerId', 'nickname avatar phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 权限检查
    const hasPermission = 
      (req.merchantId && order.merchantId._id.toString() === req.merchantId.toString()) ||
      (req.userId && order.customerId && order.customerId._id.toString() === req.userId.toString());
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此订单'
      });
    }
    
    res.json({
      success: true,
      data: {
        order
      }
    });
    
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
};

// 更新订单状态
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单ID'
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 权限检查：只有商户可以更新订单状态
    if (!req.merchantId || order.merchantId.toString() !== req.merchantId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此订单'
      });
    }
    
    // 更新订单状态
    await order.updateStatus(status, reason);
    
    // 如果订单完成，更新商户统计
    if (status === 'completed') {
      const merchant = await Merchant.findById(order.merchantId);
      if (merchant) {
        merchant.stats.totalRevenue += order.totalAmount;
        merchant.stats.completedOrders += 1;
        await merchant.save();
      }
    }
    
    res.json({
      success: true,
      message: '订单状态更新成功',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusText: order.getStatusText(),
          completedAt: order.completedAt,
          cancelReason: order.cancelReason
        }
      }
    });
    
  } catch (error) {
    console.error('更新订单状态错误:', error);
    
    if (error.message.includes('无法从')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新订单状态失败，请稍后重试'
    });
  }
};

// 取消订单
export const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的订单ID'
      });
    }
    
    const order = await Order.findById(id).session(session);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 权限检查
    const hasPermission = 
      (req.merchantId && order.merchantId.toString() === req.merchantId.toString()) ||
      (req.userId && order.customerId && order.customerId.toString() === req.userId.toString());
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此订单'
      });
    }
    
    // 检查订单状态是否可以取消
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '当前订单状态无法取消'
      });
    }
    
    // 恢复商品库存
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        product.addStock(item.quantity);
        await product.save({ session });
      }
    }
    
    // 更新订单状态
    await order.updateStatus('cancelled', reason || '用户取消');
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: '订单取消成功',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          cancelReason: order.cancelReason
        }
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    console.error('取消订单错误:', error);
    res.status(500).json({
      success: false,
      message: '取消订单失败，请稍后重试'
    });
  } finally {
    session.endSession();
  }
};

// 获取订单统计
export const getOrderStats = async (req, res) => {
  try {
    if (!req.merchantId) {
      return res.status(401).json({
        success: false,
        message: '请先登录商户账户'
      });
    }
    
    const merchantId = req.merchantId;
    
    // 获取今日统计
    const todayStats = await Order.getTodayStats(merchantId);
    
    // 获取本月统计
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: { 
              $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalAmount', 0] 
            }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // 获取待处理订单数量
    const pendingCount = await Order.countDocuments({
      merchantId,
      status: { $in: ['pending', 'confirmed', 'cooking'] }
    });
    
    res.json({
      success: true,
      data: {
        today: todayStats,
        thisMonth: monthlyStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          completedOrders: 0
        },
        pendingCount
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

// 获取排队信息
export const getQueueInfo = async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: '无效的商户ID'
      });
    }
    
    // 获取当前排队中的订单
    const queueOrders = await Order.find({
      merchantId,
      status: { $in: ['pending', 'confirmed', 'cooking'] }
    })
    .sort({ queueNumber: 1 })
    .select('queueNumber status createdAt estimatedTime');
    
    // 计算平均等待时间
    const completedOrders = await Order.find({
      merchantId,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 最近24小时
    }).select('createdAt completedAt');
    
    let averageWaitTime = 15; // 默认15分钟
    if (completedOrders.length > 0) {
      const totalWaitTime = completedOrders.reduce((sum, order) => {
        return sum + (order.completedAt - order.createdAt);
      }, 0);
      averageWaitTime = Math.round(totalWaitTime / completedOrders.length / (1000 * 60));
    }
    
    res.json({
      success: true,
      data: {
        queueOrders,
        queueLength: queueOrders.length,
        averageWaitTime,
        estimatedWaitTime: queueOrders.length * averageWaitTime
      }
    });
    
  } catch (error) {
    console.error('获取排队信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取排队信息失败'
    });
  }
};

export default {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getQueueInfo
};