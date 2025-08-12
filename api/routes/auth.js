import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  wechatLogin,
  merchantLogin,
  merchantRegister,
  refreshTokens,
  getCurrentUser,
  getCurrentMerchant,
  updateUserProfile,
  updateMerchantProfile,
  logout
} from '../controllers/authController.js';
import {
  authenticateUser,
  authenticateMerchant,
  refreshToken,
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

// 微信小程序登录验证规则
const wechatLoginValidation = [
  body('code')
    .notEmpty()
    .withMessage('微信授权码不能为空'),
  body('userInfo.nickName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度应在1-50个字符之间'),
  body('userInfo.avatarUrl')
    .optional()
    .isURL()
    .withMessage('头像URL格式不正确')
];

// 商户登录验证规则
const merchantLoginValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度应在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度应在6-20个字符之间')
];

// 商户注册验证规则
const merchantRegisterValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度应在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度应在6-20个字符之间')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
    .withMessage('密码必须包含至少一个字母和一个数字'),
  body('name')
    .notEmpty()
    .withMessage('商户名称不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('商户名称长度应在2-50个字符之间'),
  body('phone')
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地址长度不能超过200个字符')
];

// 用户信息更新验证规则
const updateUserValidation = [
  body('nickname')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度应在1-50个字符之间'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码')
];

// 商户信息更新验证规则
const updateMerchantValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('商户名称长度应在2-50个字符之间'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('描述长度不能超过200个字符'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地址长度不能超过200个字符'),
  body('businessHours.open')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('营业开始时间格式不正确（HH:MM）'),
  body('businessHours.close')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('营业结束时间格式不正确（HH:MM）')
];

// 刷新令牌验证规则
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空')
];

// ==================== 用户认证路由 ====================

// 微信小程序登录
router.post('/wechat/login', 
  rateLimit(10, 5 * 60 * 1000), // 5分钟内最多10次请求
  wechatLoginValidation,
  handleValidationErrors,
  wechatLogin
);

// 获取当前用户信息
router.get('/user/profile', 
  authenticateUser, 
  getCurrentUser
);

// 更新用户信息
router.put('/user/profile', 
  authenticateUser,
  updateUserValidation,
  handleValidationErrors,
  updateUserProfile
);

// ==================== 商户认证路由 ====================

// 商户注册
router.post('/merchant/register', 
  rateLimit(50, 60 * 60 * 1000), // 1小时内最多50次请求（测试用）
  merchantRegisterValidation,
  handleValidationErrors,
  merchantRegister
);

// 商户登录
router.post('/merchant/login', 
  rateLimit(50, 5 * 60 * 1000), // 5分钟内最多50次请求（测试用）
  merchantLoginValidation,
  handleValidationErrors,
  merchantLogin
);

// 获取当前商户信息
router.get('/merchant/profile', 
  authenticateMerchant, 
  getCurrentMerchant
);

// 更新商户信息
router.put('/merchant/profile', 
  authenticateMerchant,
  updateMerchantValidation,
  handleValidationErrors,
  updateMerchantProfile
);

// ==================== 通用认证路由 ====================

// 刷新令牌
router.post('/refresh', 
  rateLimit(20, 5 * 60 * 1000), // 5分钟内最多20次请求
  refreshTokenValidation,
  handleValidationErrors,
  refreshToken,
  refreshTokens
);

// 登出
router.post('/logout', logout);

// ==================== 健康检查路由 ====================

// API健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '认证服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 验证令牌有效性
router.get('/verify/user', authenticateUser, (req, res) => {
  res.json({
    success: true,
    message: '用户令牌有效',
    data: {
      userId: req.userId,
      role: req.user.role
    }
  });
});

router.get('/verify/merchant', authenticateMerchant, (req, res) => {
  res.json({
    success: true,
    message: '商户令牌有效',
    data: {
      merchantId: req.merchantId,
      name: req.merchant.name
    }
  });
});

export default router;