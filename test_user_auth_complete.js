import axios from 'axios';

// 测试用户注册
const testUserRegister = async () => {
  try {
    console.log('测试用户注册...');
    const response = await axios.post('http://localhost:3000/api/v1/auth/user/register', {
      username: 'testuser',
      password: 'test123456',
      nickname: '测试用户',
      phone: '13800138000'
    });
    
    console.log('✅ 用户注册成功:', {
      success: response.data.success,
      message: response.data.message,
      userId: response.data.data.user.id,
      username: response.data.data.user.username,
      nickname: response.data.data.user.nickname
    });
    
    return response.data.data.tokens.accessToken;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message === '用户名已存在') {
      console.log('ℹ️ 用户已存在，跳过注册');
      return null;
    }
    console.log('❌ 用户注册失败:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
};

// 测试用户登录
const testUserLogin = async () => {
  try {
    console.log('测试用户登录...');
    const response = await axios.post('http://localhost:3000/api/v1/auth/user/login', {
      username: 'testuser',
      password: 'test123456'
    });
    
    console.log('✅ 用户登录成功:', {
      success: response.data.success,
      message: response.data.message,
      userId: response.data.data.user.id,
      username: response.data.data.user.username,
      accessToken: response.data.data.tokens.accessToken.substring(0, 20) + '...'
    });
    
    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.log('❌ 用户登录失败:', {
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
    console.log('=== 开始完整的用户认证和订单API测试 ===\n');
    
    // 1. 测试未登录用户访问订单API
    console.log('1. 测试未登录用户访问订单API...');
    const authRequired = await testOrdersAPIWithoutAuth();
    console.log('');
    
    if (!authRequired) {
      console.log('❌ 认证要求未正确恢复');
      return;
    }
    
    // 2. 测试用户注册
    console.log('2. 测试用户注册...');
    let token = await testUserRegister();
    console.log('');
    
    // 3. 测试用户登录
    console.log('3. 测试用户登录...');
    if (!token) {
      token = await testUserLogin();
    }
    console.log('');
    
    if (!token) {
      console.log('❌ 用户登录失败');
      return;
    }
    
    // 4. 测试已登录用户访问订单API
    console.log('4. 测试已登录用户访问订单API...');
    const ordersResult = await testOrdersAPI(token);
    console.log('');
    
    if (ordersResult) {
      console.log('🎉 所有测试通过！');
      console.log('✅ 用户认证要求已恢复');
      console.log('✅ 用户注册功能正常');
      console.log('✅ 用户登录功能正常');
      console.log('✅ 已登录用户可以访问订单API');
      console.log('✅ 未登录用户无法访问订单API');
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