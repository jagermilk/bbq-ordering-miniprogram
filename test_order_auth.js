import axios from 'axios';

// 测试未登录用户提交订单
const testOrderWithoutAuth = async () => {
  try {
    console.log('测试未登录用户提交订单...');
    const response = await axios.post('http://localhost:3000/api/v1/orders', {
      merchantId: '689d9957e4f9a5cf7a934399',
      items: [{
        productId: '689d9957e4f9a5cf7a93439b',
        quantity: 1
      }],
      dineType: 'dine-in'
    });
    
    console.log('❌ 未登录用户提交订单成功（不应该发生）:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 未登录用户提交订单失败（预期行为）:', {
        status: error.response.status,
        message: error.response.data.message
      });
      return true;
    } else {
      console.log('⚠️  其他错误:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      return false;
    }
  }
};

// 主测试函数
const runTest = async () => {
  try {
    console.log('=== 测试订单认证要求 ===\n');
    
    const authRequired = await testOrderWithoutAuth();
    
    if (authRequired) {
      console.log('\n✅ 订单认证要求修复成功！');
      console.log('✅ 未登录用户无法提交订单');
    } else {
      console.log('\n❌ 订单认证要求修复失败');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
};

// 运行测试
runTest();