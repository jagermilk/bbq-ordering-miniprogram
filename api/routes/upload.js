import express from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateMerchant, authenticateUser } from '../middleware/auth.js';
import {
  uploadSingle,
  uploadMultiple,
  uploadProductImage,
  uploadMerchantAvatar,
  uploadMultipleImages,
  deleteUploadedFile,
  getFileInfo,
  getUploadStats
} from '../controllers/uploadController.js';

const router = express.Router();

// 上传限流配置
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 最多20次上传
  message: {
    success: false,
    message: '上传过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 删除文件限流
const deleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 最多10次删除
  message: {
    success: false,
    message: '删除操作过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 验证规则
const deleteFileValidation = [
  body('filename')
    .notEmpty()
    .withMessage('文件名不能为空')
    .isLength({ min: 1, max: 255 })
    .withMessage('文件名长度必须在1-255字符之间')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('文件名包含非法字符'),
  body('subfolder')
    .optional()
    .isLength({ max: 50 })
    .withMessage('子文件夹名称不能超过50字符')
    .matches(/^[a-zA-Z0-9_-]*$/)
    .withMessage('子文件夹名称包含非法字符')
];

// ==================== 菜品图片上传 ====================

/**
 * @route POST /api/upload/product-image
 * @desc 上传菜品图片
 * @access Private (商户)
 */
router.post('/product-image',
  uploadLimiter,
  authenticateMerchant,
  uploadSingle('image', 'products'),
  uploadProductImage
);

/**
 * @route POST /api/upload/product-images
 * @desc 批量上传菜品图片
 * @access Private (商户)
 */
router.post('/product-images',
  uploadLimiter,
  authenticateMerchant,
  uploadMultiple('images', 5, 'products'),
  uploadMultipleImages
);

// ==================== 商户头像上传 ====================

/**
 * @route POST /api/upload/merchant-avatar
 * @desc 上传商户头像
 * @access Private (商户)
 */
router.post('/merchant-avatar',
  uploadLimiter,
  authenticateMerchant,
  uploadSingle('avatar', 'avatars'),
  uploadMerchantAvatar
);

// ==================== 用户头像上传 ====================

/**
 * @route POST /api/upload/user-avatar
 * @desc 上传用户头像
 * @access Private (用户)
 */
router.post('/user-avatar',
  uploadLimiter,
  authenticateUser,
  uploadSingle('avatar', 'avatars'),
  async (req, res) => {
    try {
      const fileInfo = req.uploadedFile;
      
      res.json({
        success: true,
        message: '用户头像上传成功',
        data: {
          file: {
            filename: fileInfo.filename,
            originalname: fileInfo.originalname,
            url: fileInfo.url,
            size: fileInfo.size,
            mimetype: fileInfo.mimetype
          }
        }
      });
    } catch (error) {
      console.error('上传用户头像错误:', error);
      res.status(500).json({
        success: false,
        message: '上传失败，请稍后重试'
      });
    }
  }
);

// ==================== 通用上传 ====================

/**
 * @route POST /api/upload/images
 * @desc 通用图片上传（需要认证）
 * @access Private
 */
router.post('/images',
  uploadLimiter,
  (req, res, next) => {
    // 检查是否有有效的认证（用户或商户）
    if (!req.userId && !req.merchantId) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    next();
  },
  uploadMultiple('images', 3, 'general'),
  uploadMultipleImages
);

// ==================== 文件管理 ====================

/**
 * @route DELETE /api/upload/file
 * @desc 删除上传的文件
 * @access Private (商户)
 */
router.delete('/file',
  deleteLimiter,
  authenticateMerchant,
  deleteFileValidation,
  validateRequest,
  deleteUploadedFile
);

/**
 * @route GET /api/upload/file/:subfolder?/:filename
 * @desc 获取文件信息
 * @access Private (商户)
 */
router.get('/file/:filename',
  authenticateMerchant,
  getFileInfo
);

router.get('/file/:subfolder/:filename',
  authenticateMerchant,
  (req, res, next) => {
    req.params.subfolder = req.params.subfolder;
    next();
  },
  getFileInfo
);

/**
 * @route GET /api/upload/stats
 * @desc 获取上传统计信息
 * @access Private (商户)
 */
router.get('/stats',
  authenticateMerchant,
  getUploadStats
);

// ==================== 健康检查 ====================

/**
 * @route GET /api/upload/health
 * @desc 上传服务健康检查
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '上传服务运行正常',
    timestamp: new Date().toISOString(),
    service: 'upload',
    version: '1.0.0'
  });
});

// ==================== 错误处理 ====================

// 处理multer错误
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: '文件大小超过限制（最大5MB）'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: '上传文件数量超过限制'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: '上传字段名不正确'
    });
  }
  
  console.error('上传错误:', error);
  res.status(500).json({
    success: false,
    message: '文件上传失败'
  });
});

export default router;