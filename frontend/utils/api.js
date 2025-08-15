// API配置和请求封装
const BASE_URL = 'http://localhost:3000/api/v1';

// 请求拦截器
const request = (url, options = {}) => {
  const token = uni.getStorageSync('token');
  
  const defaultOptions = {
    method: 'GET',
    header: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    timeout: 10000
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    header: {
      ...defaultOptions.header,
      ...options.header
    }
  };
  
  // 处理GET请求的查询参数
  let finalUrl = `${BASE_URL}${url}`;
  if (finalOptions.method === 'GET' && finalOptions.data) {
    const params = new URLSearchParams(finalOptions.data).toString();
    finalUrl += params ? `?${params}` : '';
    delete finalOptions.data; // 删除data参数，避免uni.request错误处理
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: finalUrl,
      ...finalOptions,
      success: (res) => {
        // 处理认证错误的通用函数
        const handleAuthError = () => {
          // 获取用户类型
          const userType = uni.getStorageSync('userType') || 'user';
          
          // 清除本地token、用户信息和用户类型
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          uni.removeStorageSync('userType');
          
          // 根据用户类型跳转到不同的登录页面
          if (userType === 'merchant') {
            uni.navigateTo({
              url: '/pages/login/login?type=merchant'
            });
          } else {
            uni.navigateTo({
              url: '/pages/login/login?type=user'
            });
          }
          
          reject(new Error('认证失败，请重新登录'));
        };
        
        // 处理认证错误 - 检查所有响应中的认证错误消息
        if (res.data && res.data.message === '请提供有效的认证令牌') {
          handleAuthError();
          return;
        }
        
        // 处理401未授权状态码
        if (res.statusCode === 401) {
          handleAuthError();
          return;
        }
        
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 用户认证相关API
export const authAPI = {
  // 商户登录
  merchantLogin: async (username, password) => {
    const response = await request('/auth/merchant/login', {
      method: 'POST',
      data: { username, password }
    });
    
    // 登录成功后保存用户类型
    if (response.success && response.data.token) {
      uni.setStorageSync('userType', 'merchant');
      uni.setStorageSync('token', response.data.token);
      if (response.data.user || response.data.merchant) {
        uni.setStorageSync('userInfo', response.data.user || response.data.merchant);
      }
    }
    
    return response;
  },
  
  // 用户登录
  userLogin: async (username, password) => {
    const response = await request('/auth/user/login', {
      method: 'POST',
      data: { username, password }
    });
    
    // 登录成功后保存用户类型
    if (response.success && response.data.tokens && response.data.tokens.accessToken) {
      uni.setStorageSync('userType', 'user');
      uni.setStorageSync('token', response.data.tokens.accessToken);
      if (response.data.user) {
        uni.setStorageSync('userInfo', response.data.user);
      }
    }
    
    return response;
  },
  
  // 用户注册
  userRegister: (username, password, nickname) => {
    return request('/auth/user/register', {
      method: 'POST',
      data: { username, password, nickname }
    });
  },
  
  // 微信用户授权
  wechatAuth: (code) => {
    return request('/auth/wechat/login', {
      method: 'POST',
      data: { code }
    });
  }
};

// 菜品管理相关API
export const productAPI = {
  // 获取菜品列表
// 使用真实的商户ID
getProducts: (merchantId = '689d9957e4f9a5cf7a934399') => {
  return request(`/products/merchant/${merchantId}`);
},
  
  // 创建菜品
  createProduct: (productData) => {
    return request('/products', {
      method: 'POST',
      data: productData
    });
  },
  
  // 更新菜品
  updateProduct: (id, productData) => {
    return request(`/products/${id}`, {
      method: 'PUT',
      data: productData
    });
  },
  
  // 删除菜品
  deleteProduct: (id) => {
    return request(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};

// 订单管理相关API
export const orderAPI = {
  // 创建订单
  createOrder: (orderData) => {
    return request('/orders', {
      method: 'POST',
      data: orderData
    });
  },
  
  // 获取订单列表
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? '?' + query : ''}`);
  },
  
  // 更新订单状态
  updateOrderStatus: (id, status) => {
    return request(`/orders/${id}/status`, {
      method: 'PUT',
      data: { status }
    });
  },
  
  // 获取订单详情
  getOrderDetail: (id) => {
    return request(`/orders/${id}`);
  }
};

// 统计分析相关API
export const statsAPI = {
  // 获取销售统计
  getSalesStats: (period, startDate, endDate) => {
    const params = { period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const query = new URLSearchParams(params).toString();
    return request(`/stats/sales?${query}`);
  }
};

// 文件上传API
export const uploadAPI = {
  // 上传图片
  uploadImage: (filePath) => {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token');
      
      uni.uploadFile({
        url: `${BASE_URL}/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            resolve(data);
          } else {
            reject(new Error(`上传失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
};

// 导出request函数
export { request };

// 默认导出
export default {
  authAPI,
  productAPI,
  orderAPI,
  statsAPI,
  uploadAPI
};