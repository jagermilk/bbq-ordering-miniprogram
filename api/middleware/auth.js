import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.js';
import Merchant from '../models/Merchant.js';

/**
 * JWT认证中间件
 * 验证用户身份和权限
 */

// 生成JWT令牌
export const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

// 验证JWT令牌
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('无效的令牌');
  }
};

// 用户认证中间件
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '请提供有效的认证令牌'
      });
    }
    
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    const decoded = verifyToken(token);
    
    // 查找用户
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户账户已被禁用'
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || '认证失败'
    });
  }
};

// 商户认证中间件
export const authenticateMerchant = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '请提供有效的认证令牌'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // 查找商户
    const merchant = await Merchant.findById(decoded.merchantId).select('-password -__v');
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: '商户不存在'
      });
    }
    
    // 检查商户状态
    if (!merchant.isActive) {
      return res.status(401).json({
        success: false,
        message: '商户账户已被禁用'
      });
    }
    
    // 将商户信息添加到请求对象
    req.merchant = merchant;
    req.merchantId = merchant._id;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || '认证失败'
    });
  }
};

// 角色验证中间件
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }
    
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }
    
    next();
  };
};

// 可选认证中间件（不强制要求登录）
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const user = await User.findById(decoded.userId).select('-__v');
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

// 商户权限验证中间件（验证商户是否有权限操作指定资源）
export const verifyMerchantOwnership = (resourceField = 'merchantId') => {
  return (req, res, next) => {
    if (!req.merchant) {
      return res.status(401).json({
        success: false,
        message: '请先登录商户账户'
      });
    }
    
    // 从请求参数或请求体中获取资源的商户ID
    const resourceMerchantId = req.params[resourceField] || req.body[resourceField];
    
    if (resourceMerchantId && resourceMerchantId !== req.merchantId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限操作此资源'
      });
    }
    
    next();
  };
};

// 刷新令牌中间件
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '请提供刷新令牌'
      });
    }
    
    const decoded = verifyToken(refreshToken);
    
    // 根据令牌类型查找用户或商户
    let entity;
    if (decoded.userId) {
      entity = await User.findById(decoded.userId);
    } else if (decoded.merchantId) {
      entity = await Merchant.findById(decoded.merchantId);
    }
    
    if (!entity || (entity.isActive !== undefined && !entity.isActive) || (entity.status !== undefined && entity.status !== 'active')) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌无效'
      });
    }
    
    // 生成新的访问令牌
    const payload = decoded.userId 
      ? { userId: decoded.userId, role: entity.role }
      : { merchantId: decoded.merchantId };
    
    const newAccessToken = generateToken(payload, '2h');
    const newRefreshToken = generateToken(payload, '7d');
    
    req.tokens = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '刷新令牌失败'
    });
  }
};

// 限流中间件（简单实现）
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const requestData = requestCounts.get(key);
    
    if (now > requestData.resetTime) {
      requestData.count = 1;
      requestData.resetTime = now + windowMs;
      return next();
    }
    
    if (requestData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试'
      });
    }
    
    requestData.count++;
    next();
  };
};

export default {
  generateToken,
  verifyToken,
  authenticateUser,
  authenticateMerchant,
  requireRole,
  optionalAuth,
  verifyMerchantOwnership,
  refreshToken,
  rateLimit
};