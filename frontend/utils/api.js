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
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      ...finalOptions,
      success: (res) => {
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
  login: (username, password) => {
    return request('/auth/merchant/login', {
      method: 'POST',
      data: { username, password }
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

// 默认导出
export default {
  authAPI,
  productAPI,
  orderAPI,
  statsAPI,
  uploadAPI
};