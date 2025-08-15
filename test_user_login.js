import axios from 'axios';

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

// 测试创建用户（通过API）
const testCreateUser = async () => {
  try {
    console.log('尝试创建测试用户...');
    // 由于没有用户注册API，我们先尝试登录看用户是否存在
    const loginResult = await testUserLogin();
    if (loginResult) {
      console.log('✅ 测试用户已存在');
      return true;
    } else {
      console.log('❌ 测试用户不存在，需要手动创建');
      return false;
    }
  } catch (error) {
    console.log('❌ 创建用户测试失败:', error.message);
    return false;
  }
};

// 主测试函数
const runTests = async () => {
  try {
    console.log('=== 开始用户登录和订单API测试 ===\n');
    
    // 1. 测试未登录用户访问订单API
    console.log('1. 测试未登录用户访问订单API...');
    const authRequired = await testOrdersAPIWithoutAuth();
    console.log('');
    
    if (!authRequired) {
      console.log('❌ 认证要求未正确恢复');
      return;
    }
    
    // 2. 测试用户登录
    console.log('2. 测试用户登录...');
    const token = await testUserLogin();
    console.log('');
    
    if (!token) {
      console.log('❌ 用户登录失败，可能需要先创建测试用户');
      console.log('💡 提示：可以通过数据库直接创建用户或添加用户注册API');
      return;
    }
    
    // 3. 测试已登录用户访问订单API
    console.log('3. 测试已登录用户访问订单API...');
    const ordersResult = await testOrdersAPI(token);
    console.log('');
    
    if (ordersResult) {
      console.log('✅ 所有测试通过！');
      console.log('✅ 用户认证要求已恢复');
      console.log('✅ 用户登录功能正常');
      console.log('✅ 已登录用户可以访问订单API');
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