import User from '../models/User.js';
import Merchant from '../models/Merchant.js';
import { generateToken } from '../middleware/auth.js';
import config from '../config/config.js';
import axios from 'axios';

/**
 * 用户认证控制器
 * 处理微信登录、商户登录、令牌刷新等认证相关操作
 */

// 微信小程序登录
export const wechatLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '请提供微信授权码'
      });
    }
    
    // 调用微信API获取openid
    const wechatResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: config.wechat.appId,
        secret: config.wechat.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { openid, session_key, errcode, errmsg } = wechatResponse.data;
    
    if (errcode) {
      return res.status(400).json({
        success: false,
        message: `微信登录失败: ${errmsg}`
      });
    }
    
    // 查找或创建用户
    let user = await User.findByOpenid(openid);
    
    if (!user) {
      // 创建新用户
      user = new User({
        openid,
        nickname: userInfo?.nickName || '微信用户',
        avatar: userInfo?.avatarUrl || '',
        role: 'customer'
      });
      await user.save();
    } else {
      // 更新用户信息
      if (userInfo?.nickName) user.nickname = userInfo.nickName;
      if (userInfo?.avatarUrl) user.avatar = userInfo.avatarUrl;
      user.lastLoginAt = new Date();
      await user.save();
    }
    
    // 生成JWT令牌
    const accessToken = generateToken({
      userId: user._id,
      role: user.role
    }, '2h');
    
    const refreshToken = generateToken({
      userId: user._id,
      role: user.role
    }, '7d');
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          phone: user.phone,
          status: user.status
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '2h'
        }
      }
    });
    
  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

// 商户登录
export const merchantLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      });
    }
    
    // 查找商户
    const merchant = await Merchant.findByUsername(username);
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isValidPassword = await merchant.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 检查商户状态
    if (!merchant.isActive) {
      return res.status(401).json({
        success: false,
        message: '商户账户已被禁用'
      });
    }
    
    // 更新最后登录时间
    merchant.lastLoginAt = new Date();
    await merchant.save();
    
    // 生成JWT令牌
    const accessToken = generateToken({
      merchantId: merchant._id
    }, '8h');
    
    const refreshToken = generateToken({
      merchantId: merchant._id
    }, '30d');
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: accessToken,
        user: {
          id: merchant._id,
          username: merchant.username,
          name: merchant.name,
          description: merchant.description,
          phone: merchant.phone,
          address: merchant.address,
          avatar: merchant.avatar,
          isActive: merchant.isActive,
          businessHours: merchant.businessHours,
          settings: merchant.settings,
          stats: merchant.stats
        },
        refreshToken,
        expiresIn: '8h'
      }
    });
    
  } catch (error) {
    console.error('商户登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

// 商户注册
export const merchantRegister = async (req, res) => {
  try {
    const { username, password, name, phone, address } = req.body;
    
    // 验证必填字段
    if (!username || !password || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }
    
    // 检查用户名是否已存在
    const existingMerchant = await Merchant.findByUsername(username);
    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 创建新商户
    const merchant = new Merchant({
      username,
      password,
      name,
      phone,
      address: address || '',
      isActive: true
    });
    
    await merchant.save();
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        merchant: {
          id: merchant._id,
          username: merchant.username,
          name: merchant.name,
          phone: merchant.phone,
          address: merchant.address,
          isActive: merchant.isActive
        }
      }
    });
    
  } catch (error) {
    console.error('商户注册错误:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
};

// 刷新令牌
export const refreshTokens = async (req, res) => {
  try {
    // tokens 由 refreshToken 中间件设置
    if (req.tokens) {
      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          tokens: req.tokens
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '令牌刷新失败'
      });
    }
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    if (req.user) {
      res.json({
        success: true,
        data: {
          user: {
            id: req.user._id,
            openid: req.user.openid,
            nickname: req.user.nickname,
            avatar: req.user.avatar,
            role: req.user.role,
            phone: req.user.phone,
            status: req.user.status,
            createdAt: req.user.createdAt
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取当前商户信息
export const getCurrentMerchant = async (req, res) => {
  try {
    if (req.merchant) {
      res.json({
        success: true,
        data: {
          merchant: {
            id: req.merchant._id,
            username: req.merchant.username,
            name: req.merchant.name,
            description: req.merchant.description,
            phone: req.merchant.phone,
            address: req.merchant.address,
            avatar: req.merchant.avatar,
            isActive: req.merchant.isActive,
            businessHours: req.merchant.businessHours,
            settings: req.merchant.settings,
            stats: req.merchant.stats,
            createdAt: req.merchant.createdAt
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '商户未登录'
      });
    }
  } catch (error) {
    console.error('获取商户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新用户信息
export const updateUserProfile = async (req, res) => {
  try {
    const { nickname, phone } = req.body;
    const user = req.user;
    
    if (nickname) user.nickname = nickname;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone
        }
      }
    });
    
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
};

// 更新商户信息
export const updateMerchantProfile = async (req, res) => {
  try {
    const { name, description, phone, address, businessHours } = req.body;
    const merchant = req.merchant;
    
    if (name) merchant.name = name;
    if (description) merchant.description = description;
    if (phone) merchant.phone = phone;
    if (address) merchant.address = address;
    if (businessHours) merchant.businessHours = businessHours;
    
    await merchant.save();
    
    res.json({
      success: true,
      message: '商户信息更新成功',
      data: {
        merchant: {
          id: merchant._id,
          name: merchant.name,
          description: merchant.description,
          phone: merchant.phone,
          address: merchant.address,
          businessHours: merchant.businessHours
        }
      }
    });
    
  } catch (error) {
    console.error('更新商户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
};

// 用户登出
export const logout = async (req, res) => {
  try {
    // 在实际应用中，可以将令牌加入黑名单
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
};

export default {
  wechatLogin,
  merchantLogin,
  merchantRegister,
  refreshTokens,
  getCurrentUser,
  getCurrentMerchant,
  updateUserProfile,
  updateMerchantProfile,
  logout
};