import mongoose from 'mongoose';

/**
 * 订单模型
 * 用户下单和商户订单管理
 */
const orderSchema = new mongoose.Schema({
  // 订单号（自动生成）
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  
  // 所属商户ID
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: [true, '商户ID不能为空'],
    index: true
  },
  
  // 下单用户ID（可选，支持游客下单）
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // 订单状态
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'],
      message: '订单状态无效'
    },
    default: 'pending',
    index: true
  },
  
  // 就餐方式
  dineType: {
    type: String,
    enum: {
      values: ['dine-in', 'takeaway'],
      message: '就餐方式无效'
    },
    required: [true, '就餐方式不能为空']
  },
  
  // 订单总金额
  totalAmount: {
    type: Number,
    required: [true, '订单总金额不能为空'],
    min: [0.01, '订单金额必须大于0'],
    // 保留两位小数
    set: function(value) {
      return Math.round(value * 100) / 100;
    }
  },
  
  // 排队号码
  queueNumber: {
    type: Number,
    index: true
  },
  
  // 顾客信息
  customerInfo: {
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, '昵称最多50个字符']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
    },
    avatar: {
      type: String,
      trim: true
    }
  },
  
  // 订单商品列表
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, '商品数量至少为1']
    },
    // 商品小计
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    // 商品图片
    image: String,
    // 特殊要求
    note: {
      type: String,
      trim: true,
      maxlength: [100, '备注最多100个字符']
    }
  }],
  
  // 订单备注
  note: {
    type: String,
    trim: true,
    maxlength: [200, '订单备注最多200个字符']
  },
  
  // 预计完成时间
  estimatedTime: {
    type: Date
  },
  
  // 实际完成时间
  completedAt: {
    type: Date
  },
  
  // 取消原因
  cancelReason: {
    type: String,
    trim: true,
    maxlength: [100, '取消原因最多100个字符']
  },
  
  // 支付信息
  payment: {
    method: {
      type: String,
      enum: ['cash', 'wechat', 'alipay'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String, // 支付流水号
    paidAt: Date // 支付时间
  },
  
  // 评价信息
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [200, '评价最多200个字符']
    },
    ratedAt: Date
  },
  
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// 创建复合索引
orderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ queueNumber: 1, merchantId: 1 });
orderSchema.index({ createdAt: -1 });

// 生成订单号的中间件
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    // 生成订单号：BBQ + 时间戳 + 随机数
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `BBQ${timestamp}${random}`;
  }
  
  // 计算商品小计
  if (this.isModified('items')) {
    this.items.forEach(item => {
      item.subtotal = item.price * item.quantity;
    });
    
    // 重新计算总金额
    this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  }
  
  next();
});

// 生成排队号的静态方法
orderSchema.statics.generateQueueNumber = async function(merchantId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await this.countDocuments({
    merchantId,
    createdAt: { $gte: today },
    status: { $nin: ['cancelled'] }
  });
  
  return count + 1;
};

// 实例方法：更新订单状态
orderSchema.methods.updateStatus = function(newStatus, reason = '') {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['cooking', 'cancelled'],
    'cooking': ['ready', 'cancelled'],
    'ready': ['completed'],
    'completed': [],
    'cancelled': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`无法从${this.status}状态变更为${newStatus}状态`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelReason = reason;
  }
  
  return this.save();
};

// 实例方法：计算等待时间
orderSchema.methods.getWaitingTime = function() {
  if (this.status === 'completed') return 0;
  
  const now = new Date();
  const waitingMinutes = Math.floor((now - this.createdAt) / (1000 * 60));
  return Math.max(0, waitingMinutes);
};

// 实例方法：获取状态显示文本
orderSchema.methods.getStatusText = function() {
  const statusMap = {
    'pending': '待确认',
    'confirmed': '已确认',
    'cooking': '制作中',
    'ready': '待取餐',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[this.status] || '未知状态';
};

// 静态方法：获取商户今日订单统计
orderSchema.statics.getTodayStats = async function(merchantId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const stats = await this.aggregate([
    {
      $match: {
        merchantId: new mongoose.Types.ObjectId(merchantId),
        createdAt: { $gte: today, $lt: tomorrow }
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
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };
};

// 虚拟字段：格式化总金额
orderSchema.virtual('formattedAmount').get(function() {
  return `¥${this.totalAmount.toFixed(2)}`;
});

// 虚拟字段：客户姓名（兼容前端期望的字段名）
orderSchema.virtual('customerName').get(function() {
  if (this.customerId && this.customerId.nickname) {
    return this.customerId.nickname;
  }
  if (this.customerInfo && this.customerInfo.nickname) {
    return this.customerInfo.nickname;
  }
  return '顾客';
});

// 虚拟字段：客户电话（兼容前端期望的字段名）
orderSchema.virtual('customerPhone').get(function() {
  if (this.customerId && this.customerId.phone) {
    return this.customerId.phone;
  }
  if (this.customerInfo && this.customerInfo.phone) {
    return this.customerInfo.phone;
  }
  return null;
});

// 虚拟字段：就餐方式（兼容前端期望的字段名）
orderSchema.virtual('diningType').get(function() {
  return this.dineType === 'dine-in' ? 'dine_in' : this.dineType;
});

// 转换为JSON时包含虚拟字段
orderSchema.set('toJSON', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;