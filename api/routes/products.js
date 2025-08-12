import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  batchUpdateStatus,
  getCategories,
  getHotProducts,
  searchProducts,
  updateStock
} from '../controllers/productController.js';
import {
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

// 创建菜品验证规则
const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('菜品名称不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('菜品名称长度应在1-50个字符之间'),
  body('price')
    .notEmpty()
    .withMessage('菜品价格不能为空')
    .isFloat({ min: 0.01, max: 9999.99 })
    .withMessage('价格应在0.01-9999.99之间'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200个字符'),
  body('image')
    .optional()
    .isURL()
    .withMessage('图片URL格式不正确'),
  body('category')
    .optional()
    .isLength({ max: 30 })
    .withMessage('分类名称最多30个字符'),
  body('stock')
    .optional()
    .isInt({ min: -1 })
    .withMessage('库存数量不能为负数（-1表示无限库存）'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式'),
  body('tags.*')
    .optional()
    .isLength({ max: 20 })
    .withMessage('标签长度最多20个字符'),
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('制作时间应在1-120分钟之间'),
  body('spicyLevel')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('辣度等级应在0-5之间'),
  body('recommendLevel')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('推荐指数应在0-5之间'),
  body('sortOrder')
    .optional()
    .isInt()
    .withMessage('排序权重必须是整数')
];

// 更新菜品验证规则
const updateProductValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的菜品ID'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('菜品名称长度应在1-50个字符之间'),
  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 9999.99 })
    .withMessage('价格应在0.01-9999.99之间'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200个字符'),
  body('image')
    .optional()
    .isURL()
    .withMessage('图片URL格式不正确'),
  body('category')
    .optional()
    .isLength({ max: 30 })
    .withMessage('分类名称最多30个字符'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('可售状态必须是布尔值'),
  body('stock')
    .optional()
    .isInt({ min: -1 })
    .withMessage('库存数量不能为负数（-1表示无限库存）'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组格式'),
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('制作时间应在1-120分钟之间'),
  body('spicyLevel')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('辣度等级应在0-5之间'),
  body('recommendLevel')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('推荐指数应在0-5之间')
];

// 批量更新状态验证规则
const batchUpdateValidation = [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('请提供至少一个菜品ID'),
  body('productIds.*')
    .isMongoId()
    .withMessage('无效的菜品ID'),
  body('isAvailable')
    .isBoolean()
    .withMessage('可售状态必须是布尔值')
];

// 更新库存验证规则
const updateStockValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的菜品ID'),
  body('stock')
    .isInt({ min: -1 })
    .withMessage('库存数量不能为负数（-1表示无限库存）'),
  body('operation')
    .optional()
    .isIn(['set', 'add', 'reduce'])
    .withMessage('操作类型必须是set、add或reduce')
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
  query('sortBy')
    .optional()
    .isIn(['sortOrder', 'soldCount', 'price', 'createdAt'])
    .withMessage('排序字段无效'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向必须是asc或desc')
];

// ==================== 商户菜品管理路由 ====================

// 创建菜品（商户专用）
router.post('/', 
  authenticateMerchant,
  rateLimit(50, 60 * 60 * 1000), // 1小时内最多50次请求
  createProductValidation,
  handleValidationErrors,
  createProduct
);

// 获取商户自己的菜品列表
router.get('/my', 
  authenticateMerchant,
  queryValidation,
  handleValidationErrors,
  getProducts
);

// 更新菜品（商户专用）
router.put('/:id', 
  authenticateMerchant,
  updateProductValidation,
  handleValidationErrors,
  updateProduct
);

// 删除菜品（商户专用）
router.delete('/:id', 
  authenticateMerchant,
  param('id').isMongoId().withMessage('无效的菜品ID'),
  handleValidationErrors,
  deleteProduct
);

// 批量更新菜品状态（商户专用）
router.patch('/batch/status', 
  authenticateMerchant,
  batchUpdateValidation,
  handleValidationErrors,
  batchUpdateStatus
);

// 更新菜品库存（商户专用）
router.patch('/:id/stock', 
  authenticateMerchant,
  updateStockValidation,
  handleValidationErrors,
  updateStock
);

// 获取商户菜品分类（商户专用）
router.get('/my/categories', 
  authenticateMerchant,
  getCategories
);

// 获取商户热销菜品（商户专用）
router.get('/my/hot', 
  authenticateMerchant,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1-50之间'),
  handleValidationErrors,
  getHotProducts
);

// ==================== 公开菜品查询路由 ====================

// 获取指定商户的菜品列表（公开）
router.get('/merchant/:merchantId', 
  param('merchantId').isMongoId().withMessage('无效的商户ID'),
  queryValidation,
  handleValidationErrors,
  optionalAuth,
  getProducts
);

// 获取单个菜品详情（公开）
router.get('/:id', 
  param('id').isMongoId().withMessage('无效的菜品ID'),
  handleValidationErrors,
  optionalAuth,
  getProduct
);

// 获取指定商户的菜品分类（公开）
router.get('/merchant/:merchantId/categories', 
  param('merchantId').isMongoId().withMessage('无效的商户ID'),
  handleValidationErrors,
  getCategories
);

// 获取指定商户的热销菜品（公开）
router.get('/merchant/:merchantId/hot', 
  param('merchantId').isMongoId().withMessage('无效的商户ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1-50之间'),
  handleValidationErrors,
  getHotProducts
);

// 搜索指定商户的菜品（公开）
router.get('/merchant/:merchantId/search', 
  param('merchantId').isMongoId().withMessage('无效的商户ID'),
  query('keyword')
    .notEmpty()
    .withMessage('搜索关键词不能为空')
    .isLength({ min: 1, max: 50 })
    .withMessage('关键词长度应在1-50个字符之间'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1-50之间'),
  handleValidationErrors,
  searchProducts
);

// ==================== 健康检查路由 ====================

// API健康检查
router.get('/health/check', (req, res) => {
  res.json({
    success: true,
    message: '菜品服务运行正常',
    timestamp: new Date().toISOString()
  });
});

export default router;