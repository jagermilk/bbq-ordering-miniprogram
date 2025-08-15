import axios from 'axios';

// 生成随机用户名
const randomUsername = 'testuser' + Math.floor(Math.random() * 10000);

// 测试用户注册
const testUserRegister = async () => {
  try {
    console.log(`测试用户注册 (${randomUsername})...`);
    const response = await axios.post('http://localhost:3000/api/v1/auth/user/register', {
      username: randomUsername,
      password: 'test123456',
      nickname: '测试用户',
      phone: '13800138000'
    });
    
    console.log('✅ 用户注册成功:', {
      success: response.data.success,
      message: response.data.message,
      userId: response.data.data.user.id,
      username: response.data.data.user.username,
      isActive: response.data.data.user.isActive
    });
    
    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.log('❌ 用户注册失败:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
};

// 测试访问订单API
const testOrdersAPI = async (token) => {
  try {
    console.log('测试已登录用户访问订单API...');
    const response = await axios.get('http://localhost:3000/api/v1/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 订单API访问成功:', {
      success: response.data.success,
      ordersCount: response.data.data.orders.length,
      pagination: response.data.data.pagination
    });
    
    return response.data;
  } catch (error) {
    console.log('❌ 订单API访问失败:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
};

// 测试未登录访问订单API
const testOrdersAPIWithoutAuth = async () => {
  try {
    console.log('测试未登录用户访问订单API...');
    const response = await axios.get('http://localhost:3000/api/v1/orders');
    console.log('❌ 未登录访问订单API成功（不应该发生）:', response.data);
    return false;
  } catch (error) {
    console.log('✅ 未登录访问订单API失败（预期行为）:', {
      status: error.response?.status,
      message: error.response?.data?.message
    });
    return true;
  }
};

// 主测试函数
const runTests = async () => {
  try {
    console.log('=== 开始最终用户认证测试 ===\n');
    
    // 1. 测试未登录用户访问订单API
    console.log('1. 测试未登录用户访问订单API...');
    const authRequired = await testOrdersAPIWithoutAuth();
    console.log('');
    
    if (!authRequired) {
      console.log('❌ 认证要求未正确恢复');
      return;
    }
    
    // 2. 测试用户注册并获取token
    console.log('2. 测试用户注册...');
    const token = await testUserRegister();
    console.log('');
    
    if (!token) {
      console.log('❌ 用户注册失败');
      return;
    }
    
    // 3. 测试已登录用户访问订单API
    console.log('3. 测试已登录用户访问订单API...');
    const ordersResult = await testOrdersAPI(token);
    console.log('');
    
    if (ordersResult) {
      console.log('🎉 所有测试通过！');
      console.log('✅ 用户认证要求已恢复');
      console.log('✅ 用户注册功能正常');
      console.log('✅ 已登录用户可以访问订单API');
      console.log('✅ 未登录用户无法访问订单API');
      console.log('');
      console.log('🔧 功能总结:');
      console.log('- 恢复了orderController.js中getOrders函数的用户认证要求');
      console.log('- 添加了用户账号密码登录功能');
      console.log('- 添加了用户注册功能');
      console.log('- 修复了认证中间件中的用户状态检查');
    } else {
      console.log('❌ 订单API访问测试失败');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
};

// 运行测试
runTests();