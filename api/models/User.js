import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * 用户模型
 * 支持微信小程序用户和商户用户
 */
const userSchema = new mongoose.Schema({
  // 微信用户唯一标识
  openid: {
    type: String,
    unique: true,
    sparse: true, // 允许null值，但不允许重复
    index: true
  },
  
  // 用户名（用于账号密码登录）
  username: {
    type: String,
    unique: true,
    sparse: true, // 允许null值，但不允许重复
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  
  // 密码（用于账号密码登录）
  password: {
    type: String,
    minlength: [6, '密码至少6个字符']
  },
  
  // 用户昵称
  nickname: {
    type: String,
    trim: true
  },
  
  // 用户头像
  avatar: {
    type: String,
    trim: true
  },
  
  // 用户角色
  role: {
    type: String,
    enum: ['customer', 'merchant'],
    default: 'customer',
    index: true
  },
  
  // 手机号（可选）
  phone: {
    type: String,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  
  // 用户状态
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true, // 自动管理createdAt和updatedAt
  versionKey: false // 不需要__v字段
});

// 创建索引
userSchema.index({ openid: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// 实例方法：检查是否为商户
userSchema.methods.isMerchant = function() {
  return this.role === 'merchant';
};

// 实例方法：检查是否为普通用户
userSchema.methods.isCustomer = function() {
  return this.role === 'customer';
};

// 静态方法：根据openid查找用户
userSchema.statics.findByOpenid = function(openid) {
  return this.findOne({ openid, isActive: true });
};

// 静态方法：根据用户名查找用户
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username, isActive: true });
};

// 实例方法：比较密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// 中间件：密码加密
userSchema.pre('save', async function(next) {
  // 如果密码被修改，则加密
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // 更新时自动设置updatedAt
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// 转换为JSON时的处理
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  // 不返回敏感信息
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;