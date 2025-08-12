import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * 商户模型
 * 商户信息和登录认证
 */
const merchantSchema = new mongoose.Schema({
  // 商户用户名（登录用）
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符'],
    match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
  },
  
  // 密码（加密存储）
  password: {
    type: String,
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 查询时默认不返回密码字段
  },
  
  // 商户名称
  name: {
    type: String,
    required: [true, '商户名称不能为空'],
    trim: true,
    maxlength: [50, '商户名称最多50个字符']
  },
  
  // 商户描述
  description: {
    type: String,
    trim: true,
    maxlength: [200, '商户描述最多200个字符']
  },
  
  // 联系电话
  phone: {
    type: String,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  
  // 商户地址
  address: {
    type: String,
    trim: true,
    maxlength: [100, '地址最多100个字符']
  },
  
  // 商户头像/logo
  avatar: {
    type: String,
    trim: true
  },
  
  // 营业状态
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 营业时间
  businessHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '22:00'
    }
  },
  
  // 商户设置
  settings: {
    // 是否接受新订单
    acceptOrders: {
      type: Boolean,
      default: true
    },
    // 自动确认订单
    autoConfirm: {
      type: Boolean,
      default: false
    },
    // 预计制作时间（分钟）
    estimatedTime: {
      type: Number,
      default: 15,
      min: 5,
      max: 120
    }
  },
  
  // 统计信息
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  
  // 最后登录时间
  lastLoginAt: {
    type: Date
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

// 创建索引
merchantSchema.index({ username: 1 });
merchantSchema.index({ isActive: 1 });
merchantSchema.index({ createdAt: -1 });

// 密码加密中间件
merchantSchema.pre('save', async function(next) {
  // 只有密码被修改时才加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：验证密码
merchantSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('密码验证失败');
  }
};

// 实例方法：检查是否在营业时间
merchantSchema.methods.isBusinessHours = function() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM格式
  return currentTime >= this.businessHours.start && currentTime <= this.businessHours.end;
};

// 实例方法：更新统计信息
merchantSchema.methods.updateStats = function(orderAmount) {
  this.stats.totalOrders += 1;
  this.stats.totalRevenue += orderAmount;
  return this.save();
};

// 静态方法：根据用户名查找商户
merchantSchema.statics.findByUsername = function(username) {
  return this.findOne({ username, isActive: true }).select('+password');
};

// 转换为JSON时的处理
merchantSchema.methods.toJSON = function() {
  const merchant = this.toObject();
  // 不返回密码
  delete merchant.password;
  delete merchant.__v;
  return merchant;
};

const Merchant = mongoose.model('Merchant', merchantSchema);

export default Merchant;