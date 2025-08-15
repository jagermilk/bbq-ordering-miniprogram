import axios from 'axios';

// 测试用户登录和token保存修复
const testUserLoginTokenFix = async () => {
  try {
    console.log('=== 测试用户登录token修复 ===\n');
    
    // 1. 测试用户登录
    console.log('1. 测试用户登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/user/login', {
      username: 'testuser',
      password: 'test123456'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 用户登录成功');
      console.log('   用户ID:', loginResponse.data.data.user.id);
      console.log('   用户名:', loginResponse.data.data.user.username);
      console.log('   Token结构:', {
        hasTokens: !!loginResponse.data.data.tokens,
        hasAccessToken: !!loginResponse.data.data.tokens?.accessToken,
        hasRefreshToken: !!loginResponse.data.data.tokens?.refreshToken,
        accessTokenPreview: loginResponse.data.data.tokens?.accessToken?.substring(0, 20) + '...'
      });
      
      // 2. 使用正确的accessToken测试订单API
      const accessToken = loginResponse.data.data.tokens.accessToken;
      console.log('\n2. 测试使用accessToken访问订单API...');
      
      const ordersResponse = await axios.get('http://localhost:3000/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (ordersResponse.data.success) {
        console.log('✅ 订单API访问成功');
        console.log('   订单数量:', ordersResponse.data.data.orders.length);
        console.log('   分页信息:', ordersResponse.data.data.pagination);
      } else {
        console.log('❌ 订单API访问失败:', ordersResponse.data.message);
      }
      
    } else {
      console.log('❌ 用户登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ 测试过程中发生错误:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data?.message || error.response.statusText);
    } else {
      console.log('   错误:', error.message);
    }
  }
  
  console.log('\n=== 测试完成 ===');
};

// 测试未登录访问订单API（应该返回401）
const testUnauthorizedAccess = async () => {
  try {
    console.log('\n=== 测试未登录访问订单API ===\n');
    
    const response = await axios.get('http://localhost:3000/api/v1/orders');
    console.log('❌ 未登录访问订单API成功（不应该发生）:', response.data);
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ 未登录访问订单API正确返回401');
      console.log('   错误信息:', error.response.data.message);
    } else {
      console.log('❌ 未预期的错误:', error.message);
    }
  }
};

// 运行所有测试
const runAllTests = async () => {
  await testUnauthorizedAccess();
  await testUserLoginTokenFix();
};

// 执行测试
runAllTests();