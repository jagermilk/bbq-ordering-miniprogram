import axios from 'axios';

/**
 * API接口测试脚本
 * 测试烧烤摆摊点单小程序的所有API接口
 */

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_DATA = {
  merchant: {
    username: 'test_merchant',
    password: 'test123456',
    name: '测试烧烤摊',
    description: '美味烧烤，欢迎品尝',
    phone: '13800138000',
    address: '测试地址123号'
  },
  user: {
    openid: 'test_openid_123456789012345678',
    nickname: '测试用户',
    avatar: 'https://example.com/avatar.jpg'
  },
  product: {
    name: '烤羊肉串',
    price: 3.5,
    description: '新鲜羊肉，香嫩可口',
    category: '烤串类',
    stock: 100
  }
};

let authTokens = {
  merchant: null,
  user: null
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 测试工具函数
const test = async (name, testFn) => {
  try {
    console.log(`\n🧪 测试: ${name}`);
    await testFn();
    console.log(`✅ 通过: ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ 失败: ${name}`);
    console.log(`   错误: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
  }
};

const apiCall = async (method, url, data = null, headers = {}) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  const response = await axios(config);
  return response.data;
};

// 健康检查测试
const testHealthCheck = async () => {
  const config = {
    method: 'GET',
    url: 'http://localhost:3000/health',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await axios(config);
  if (!response.data.success) {
    throw new Error('健康检查失败');
  }
};

// 添加延迟函数避免限流
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 商户认证测试
const testMerchantAuth = async () => {
  // 注册商户
  const registerResponse = await apiCall('POST', '/auth/merchant/register', TEST_DATA.merchant);
  if (!registerResponse.success) {
    throw new Error(`商户注册失败: ${registerResponse.message}`);
  }
  
  // 商户登录
  const loginResponse = await apiCall('POST', '/auth/merchant/login', {
    username: TEST_DATA.merchant.username,
    password: TEST_DATA.merchant.password
  });
  
  if (!loginResponse.success || !loginResponse.data.token) {
    throw new Error(`商户登录失败: ${loginResponse.message}`);
  }
  
  authTokens.merchant = loginResponse.data.token;
};

// 用户认证测试
const testUserAuth = async () => {
  // 模拟微信登录
  const loginResponse = await apiCall('POST', '/auth/wechat/login', {
    code: 'test_code_123',
    userInfo: TEST_DATA.user
  });
  
  if (!loginResponse.success || !loginResponse.data.token) {
    throw new Error(`用户登录失败: ${loginResponse.message}`);
  }
  
  authTokens.user = loginResponse.data.token;
};

// 菜品管理测试
const testProductManagement = async () => {
  const headers = { Authorization: `Bearer ${authTokens.merchant}` };
  
  // 创建菜品
  const createResponse = await apiCall('POST', '/products', TEST_DATA.product, headers);
  if (!createResponse.success) {
    throw new Error(`创建菜品失败: ${createResponse.message}`);
  }
  
  const productId = createResponse.data.product._id;
  
  // 获取菜品列表
  const listResponse = await apiCall('GET', '/products', null, headers);
  if (!listResponse.success || !Array.isArray(listResponse.data.products)) {
    throw new Error(`获取菜品列表失败: ${listResponse.message}`);
  }
  
  // 更新菜品
  const updateResponse = await apiCall('PUT', `/products/${productId}`, {
    name: '烤羊肉串（特价）',
    price: 3.0
  }, headers);
  
  if (!updateResponse.success) {
    throw new Error(`更新菜品失败: ${updateResponse.message}`);
  }
  
  // 获取菜品详情
  const detailResponse = await apiCall('GET', `/products/${productId}`);
  if (!detailResponse.success) {
    throw new Error(`获取菜品详情失败: ${detailResponse.message}`);
  }
  
  return productId;
};

// 订单管理测试
const testOrderManagement = async (productId) => {
  const userHeaders = { Authorization: `Bearer ${authTokens.user}` };
  const merchantHeaders = { Authorization: `Bearer ${authTokens.merchant}` };
  
  // 创建订单
  const orderData = {
    items: [{
      productId: productId,
      quantity: 2
    }],
    diningType: 'dine_in',
    customerInfo: {
      name: '测试顾客',
      phone: '13900139000'
    },
    note: '不要辣'
  };
  
  const createResponse = await apiCall('POST', '/orders', orderData, userHeaders);
  if (!createResponse.success) {
    throw new Error(`创建订单失败: ${createResponse.message}`);
  }
  
  const orderId = createResponse.data.order._id;
  
  // 获取用户订单列表
  const userOrdersResponse = await apiCall('GET', '/orders/user', null, userHeaders);
  if (!userOrdersResponse.success) {
    throw new Error(`获取用户订单失败: ${userOrdersResponse.message}`);
  }
  
  // 获取商户订单列表
  const merchantOrdersResponse = await apiCall('GET', '/orders/merchant', null, merchantHeaders);
  if (!merchantOrdersResponse.success) {
    throw new Error(`获取商户订单失败: ${merchantOrdersResponse.message}`);
  }
  
  // 更新订单状态
  const updateStatusResponse = await apiCall('PUT', `/orders/${orderId}/status`, {
    status: 'confirmed'
  }, merchantHeaders);
  
  if (!updateStatusResponse.success) {
    throw new Error(`更新订单状态失败: ${updateStatusResponse.message}`);
  }
  
  return orderId;
};

// 统计分析测试
const testStatsAnalysis = async () => {
  const headers = { Authorization: `Bearer ${authTokens.merchant}` };
  
  // 获取商户概览
  const overviewResponse = await apiCall('GET', '/stats/overview', null, headers);
  if (!overviewResponse.success) {
    throw new Error(`获取商户概览失败: ${overviewResponse.message}`);
  }
  
  // 获取销售统计
  const salesResponse = await apiCall('GET', '/stats/sales?period=today', null, headers);
  if (!salesResponse.success) {
    throw new Error(`获取销售统计失败: ${salesResponse.message}`);
  }
  
  // 获取订单统计
  const orderStatsResponse = await apiCall('GET', '/stats/orders?period=today', null, headers);
  if (!orderStatsResponse.success) {
    throw new Error(`获取订单统计失败: ${orderStatsResponse.message}`);
  }
  
  // 获取实时统计
  const realtimeResponse = await apiCall('GET', '/stats/realtime', null, headers);
  if (!realtimeResponse.success) {
    throw new Error(`获取实时统计失败: ${realtimeResponse.message}`);
  }
};

// 文件上传测试（模拟）
const testFileUpload = async () => {
  const headers = { Authorization: `Bearer ${authTokens.merchant}` };
  
  // 检查上传服务健康状态
  const healthResponse = await apiCall('GET', '/upload/health');
  if (!healthResponse.success) {
    throw new Error(`上传服务健康检查失败: ${healthResponse.message}`);
  }
  
  // 获取上传统计
  const statsResponse = await apiCall('GET', '/upload/stats', null, headers);
  if (!statsResponse.success) {
    throw new Error(`获取上传统计失败: ${statsResponse.message}`);
  }
};

// 运行所有测试
const runAllTests = async () => {
  console.log('🚀 开始API接口测试...');
  console.log('=' .repeat(50));
  
  try {
    await test('健康检查', testHealthCheck);
    await delay(1000); // 延迟1秒
    
    await test('商户认证', testMerchantAuth);
    await delay(1000);
    
    await test('用户认证', testUserAuth);
    await delay(1000);
    
    const productId = await test('菜品管理', () => testProductManagement());
    await delay(1000);
    
    await test('订单管理', () => testOrderManagement(productId));
    await delay(1000);
    
    await test('统计分析', testStatsAnalysis);
    await delay(1000);
    
    await test('文件上传', testFileUpload);
    
  } catch (error) {
    console.log(`\n💥 测试过程中发生严重错误: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: '测试执行', error: error.message });
  }
  
  // 输出测试结果
  console.log('\n' + '=' .repeat(50));
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🔍 错误详情:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 API接口测试完成!');
  
  // 如果有失败的测试，退出码为1
  if (testResults.failed > 0) {
    process.exit(1);
  }
};

// 处理未捕获的错误
process.on('unhandledRejection', (reason, promise) => {
  console.log('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.log('💥 未捕获的异常:', error.message);
  process.exit(1);
});

// 运行测试
runAllTests().catch(error => {
  console.log('💥 测试运行失败:', error.message);
  process.exit(1);
});