// 通用工具函数

// 格式化价格
export const formatPrice = (price) => {
  return `¥${parseFloat(price).toFixed(2)}`;
};

// 格式化时间
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 格式化日期
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 订单状态映射
export const orderStatusMap = {
  'pending': '待确认',
  'confirmed': '已确认',
  'cooking': '制作中',
  'ready': '待取餐',
  'completed': '已完成',
  'cancelled': '已取消'
};

// 获取订单状态文本
export const getOrderStatusText = (status) => {
  return orderStatusMap[status] || '未知状态';
};

// 获取订单状态颜色
export const getOrderStatusColor = (status) => {
  const colorMap = {
    'pending': '#FFA500',
    'confirmed': '#1890FF',
    'cooking': '#FF6B35',
    'ready': '#52C41A',
    'completed': '#52C41A',
    'cancelled': '#FF4D4F'
  };
  return colorMap[status] || '#666666';
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 显示Toast
export const showToast = (title, icon = 'none', duration = 2000) => {
  uni.showToast({
    title,
    icon,
    duration
  });
};

// 显示Loading
export const showLoading = (title = '加载中...') => {
  uni.showLoading({
    title,
    mask: true
  });
};

// 隐藏Loading
export const hideLoading = () => {
  uni.hideLoading();
};

// 显示确认对话框
export const showConfirm = (content, title = '提示') => {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

// 页面跳转
export const navigateTo = (url) => {
  uni.navigateTo({ url });
};

export const redirectTo = (url) => {
  uni.redirectTo({ url });
};

export const switchTab = (url) => {
  uni.switchTab({ url });
};

// 获取用户信息
export const getUserInfo = () => {
  return uni.getStorageSync('userInfo') || null;
};

// 设置用户信息
export const setUserInfo = (userInfo) => {
  uni.setStorageSync('userInfo', userInfo);
};

// 清除用户信息
export const clearUserInfo = () => {
  uni.removeStorageSync('userInfo');
  uni.removeStorageSync('token');
};

// 检查是否登录
export const isLoggedIn = () => {
  const token = uni.getStorageSync('token');
  return !!token;
};

// 生成随机ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 深拷贝
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// 计算购物车总价
export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// 计算购物车总数量
export const calculateCartCount = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
};

// 验证手机号
export const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 验证邮箱
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default {
  formatPrice,
  formatTime,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  navigateTo,
  redirectTo,
  switchTab,
  getUserInfo,
  setUserInfo,
  clearUserInfo,
  isLoggedIn,
  generateId,
  deepClone,
  calculateCartTotal,
  calculateCartCount,
  validatePhone,
  validateEmail
};