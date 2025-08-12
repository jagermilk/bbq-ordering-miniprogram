import axios from 'axios';

/**
 * 调试API测试脚本
 * 获取详细的错误信息
 */

const BASE_URL = 'http://localhost:3000';

const debugTest = async () => {
  console.log('🔍 开始调试API测试...');
  
  try {
    // 测试商户注册
    console.log('\n📝 测试商户注册...');
    const registerData = {
      username: 'testmerchant' + Math.floor(Math.random() * 1000),
      password: 'Test123456',
      name: '测试烧烤摊',
      description: '美味烧烤，欢迎品尝',
      phone: '13800138000',
      address: '测试地址123号'
    };
    
    console.log('发送数据:', JSON.stringify(registerData, null, 2));
    
    const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/merchant/register`, registerData);
    console.log('✅ 商户注册成功:', registerResponse.data);
    
  } catch (error) {
    console.log('❌ 商户注册失败');
    console.log('状态码:', error.response?.status);
    console.log('错误信息:', error.response?.data);
    console.log('完整错误:', error.message);
    
    if (error.response?.data?.errors) {
      console.log('\n📋 验证错误详情:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`${index + 1}. 字段: ${err.path || err.param}, 错误: ${err.msg}`);
      });
    }
  }
};

debugTest();