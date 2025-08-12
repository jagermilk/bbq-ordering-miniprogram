import { validationResult } from 'express-validator';

/**
 * 验证中间件
 * 处理express-validator的验证结果
 */

// 验证请求数据
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: errorMessages
    });
  }
  
  next();
};

// 可选验证（有错误时警告但不阻止请求）
export const validateRequestOptional = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    // 将验证错误添加到请求对象中，供后续处理
    req.validationWarnings = errorMessages;
    console.warn('验证警告:', errorMessages);
  }
  
  next();
};

// 自定义验证函数
export const customValidators = {
  // 验证手机号
  isChinesePhone: (value) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  },
  
  // 验证微信openid格式
  isWechatOpenId: (value) => {
    const openIdRegex = /^[a-zA-Z0-9_-]{28}$/;
    return openIdRegex.test(value);
  },
  
  // 验证价格格式（最多两位小数）
  isValidPrice: (value) => {
    const price = parseFloat(value);
    return !isNaN(price) && price >= 0 && /^\d+(\.\d{1,2})?$/.test(value.toString());
  },
  
  // 验证订单状态
  isValidOrderStatus: (value) => {
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    return validStatuses.includes(value);
  },
  
  // 验证商户营业状态
  isValidMerchantStatus: (value) => {
    const validStatuses = ['open', 'closed', 'busy'];
    return validStatuses.includes(value);
  },
  
  // 验证用户角色
  isValidUserRole: (value) => {
    const validRoles = ['customer', 'merchant'];
    return validRoles.includes(value);
  },
  
  // 验证就餐方式
  isValidDiningType: (value) => {
    const validTypes = ['dine_in', 'takeaway'];
    return validTypes.includes(value);
  },
  
  // 验证时间格式（HH:MM）
  isValidTimeFormat: (value) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(value);
  },
  
  // 验证MongoDB ObjectId格式
  isValidObjectId: (value) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(value);
  },
  
  // 验证数组长度
  isValidArrayLength: (min, max) => {
    return (value) => {
      if (!Array.isArray(value)) return false;
      return value.length >= min && value.length <= max;
    };
  },
  
  // 验证图片URL格式
  isValidImageUrl: (value) => {
    if (!value) return true; // 允许空值
    const urlRegex = /^(https?:\/\/)|(^\/uploads\/).*\.(jpg|jpeg|png|gif|webp)$/i;
    return urlRegex.test(value);
  },
  
  // 验证营业时间格式
  isValidBusinessHours: (value) => {
    if (!value || typeof value !== 'object') return false;
    
    const requiredFields = ['open', 'close'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    return requiredFields.every(field => {
      return value[field] && timeRegex.test(value[field]);
    });
  },
  
  // 验证坐标格式
  isValidCoordinate: (value) => {
    if (!value || typeof value !== 'object') return false;
    
    const { latitude, longitude } = value;
    
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }
};

// 注册自定义验证器到express-validator
export const registerCustomValidators = () => {
  // 这里可以注册自定义验证器到express-validator
  // 但由于我们使用的是函数式验证，暂时不需要
};

export default {
  validateRequest,
  validateRequestOptional,
  customValidators,
  registerCustomValidators
};