import mongoose from 'mongoose';

/**
 * 菜品模型
 * 商户的菜品信息管理
 */
const productSchema = new mongoose.Schema({
  // 所属商户ID
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: [true, '商户ID不能为空'],
    index: true
  },
  
  // 菜品名称
  name: {
    type: String,
    required: [true, '菜品名称不能为空'],
    trim: true,
    maxlength: [50, '菜品名称最多50个字符']
  },
  
  // 菜品价格（单位：元）
  price: {
    type: Number,
    required: [true, '菜品价格不能为空'],
    min: [0.01, '价格必须大于0'],
    max: [9999.99, '价格不能超过9999.99元'],
    // 保留两位小数
    set: function(value) {
      return Math.round(value * 100) / 100;
    }
  },
  
  // 菜品描述
  description: {
    type: String,
    trim: true,
    maxlength: [200, '菜品描述最多200个字符']
  },
  
  // 菜品图片URL
  image: {
    type: String,
    trim: true
  },
  
  // 菜品分类
  category: {
    type: String,
    trim: true,
    maxlength: [30, '分类名称最多30个字符'],
    index: true
  },
  
  // 是否可售
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // 库存数量（-1表示无限库存）
  stock: {
    type: Number,
    default: -1,
    min: [-1, '库存不能为负数']
  },
  
  // 销售数量统计
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 菜品标签
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签最多20个字符']
  }],
  
  // 营养信息（可选）
  nutrition: {
    calories: Number, // 卡路里
    protein: Number,  // 蛋白质(g)
    fat: Number,      // 脂肪(g)
    carbs: Number     // 碳水化合物(g)
  },
  
  // 制作时间（分钟）
  cookingTime: {
    type: Number,
    default: 10,
    min: [1, '制作时间至少1分钟'],
    max: [120, '制作时间最多120分钟']
  },
  
  // 辣度等级（0-5）
  spicyLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // 推荐指数（0-5）
  recommendLevel: {
    type: Number,
    default: 3,
    min: 0,
    max: 5
  },
  
  // 排序权重（数字越大越靠前）
  sortOrder: {
    type: Number,
    default: 0
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
productSchema.index({ merchantId: 1, isAvailable: 1 });
productSchema.index({ merchantId: 1, category: 1 });
productSchema.index({ merchantId: 1, sortOrder: -1, createdAt: -1 });
productSchema.index({ soldCount: -1 }); // 热销排序

// 虚拟字段：是否有库存
productSchema.virtual('inStock').get(function() {
  return this.stock === -1 || this.stock > 0;
});

// 虚拟字段：格式化价格
productSchema.virtual('formattedPrice').get(function() {
  return `¥${this.price.toFixed(2)}`;
});

// 实例方法：检查库存
productSchema.methods.checkStock = function(quantity = 1) {
  if (this.stock === -1) return true; // 无限库存
  return this.stock >= quantity;
};

// 实例方法：减少库存
productSchema.methods.reduceStock = function(quantity = 1) {
  if (this.stock === -1) return true; // 无限库存
  if (this.stock >= quantity) {
    this.stock -= quantity;
    this.soldCount += quantity;
    return true;
  }
  return false;
};

// 实例方法：增加库存
productSchema.methods.addStock = function(quantity = 1) {
  if (this.stock === -1) return; // 无限库存不需要增加
  this.stock += quantity;
  this.soldCount = Math.max(0, this.soldCount - quantity);
};

// 静态方法：根据商户ID获取可售菜品
productSchema.statics.findAvailableByMerchant = function(merchantId, options = {}) {
  const query = { 
    merchantId, 
    isAvailable: true 
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .sort({ sortOrder: -1, createdAt: -1 })
    .limit(options.limit || 50);
};

// 静态方法：获取热销菜品
productSchema.statics.findHotProducts = function(merchantId, limit = 10) {
  return this.find({ 
    merchantId, 
    isAvailable: true,
    soldCount: { $gt: 0 }
  })
  .sort({ soldCount: -1 })
  .limit(limit);
};

// 静态方法：搜索菜品
productSchema.statics.searchProducts = function(merchantId, keyword) {
  const regex = new RegExp(keyword, 'i');
  return this.find({
    merchantId,
    isAvailable: true,
    $or: [
      { name: regex },
      { description: regex },
      { tags: { $in: [regex] } }
    ]
  });
};

// 中间件：更新时自动设置updatedAt
productSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// 转换为JSON时包含虚拟字段
productSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;