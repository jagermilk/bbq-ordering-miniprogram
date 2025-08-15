import axios from 'axios';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * 测试订单创建功能
 * 验证customerInfo是否正确使用当前登录用户的信息
 */
async function testOrderCreation() {
  try {
    console.log('=== 测试订单创建功能 ===\n');
    
    // 1. 用户登录获取token
    console.log('1. 用户登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/user/login`, {
      username: 'testuser',
      password: 'test123456'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.tokens.accessToken;
    const userInfo = loginResponse.data.data.user;
    console.log('✅ 登录成功');
    console.log('   用户信息:', {
      id: userInfo.id,
      nickname: userInfo.nickname,
      phone: userInfo.phone
    });
    
    // 2. 创建订单（尝试传递不同的customerInfo）
    console.log('\n2. 创建订单（传递错误的customerInfo）...');
    const orderData = {
      merchantId: '689d9957e4f9a5cf7a934399',
      items: [
        {
          productId: '689d999148584fa27b107f11',
          quantity: 2,
          note: '不要辣'
        }
      ],
      dineType: 'dine-in',
      customerInfo: {
        nickname: '假冒用户',
        phone: '99999999999'
      },
      note: '测试订单'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.data.success) {
      console.log('❌ 订单创建失败:', createResponse.data.message);
      if (createResponse.data.errors) {
        console.log('   详细错误:', createResponse.data.errors);
      }
      return;
    }
    
    const order = createResponse.data.data.order;
    console.log('✅ 订单创建成功');
    console.log('   订单ID:', order.id);
    console.log('   订单号:', order.orderNumber);
    
    // 3. 查询订单详情，验证customerInfo
    console.log('\n3. 查询订单详情...');
    const orderDetailResponse = await axios.get(`${API_BASE_URL}/orders/${order.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!orderDetailResponse.data.success) {
      console.log('❌ 查询订单详情失败:', orderDetailResponse.data.message);
      return;
    }
    
    const orderDetail = orderDetailResponse.data.data.order;
    console.log('✅ 订单详情查询成功');
    console.log('   订单中的customerInfo:', orderDetail.customerInfo);
    
    // 4. 验证customerInfo是否使用了真实用户信息
    const expectedCustomerInfo = {
      nickname: userInfo.nickname,
      phone: userInfo.phone
    };
    
    const actualCustomerInfo = {
      nickname: orderDetail.customerInfo.nickname,
      phone: orderDetail.customerInfo.phone
    };
    
    console.log('\n4. 验证customerInfo...');
    console.log('   期望的customerInfo:', expectedCustomerInfo);
    console.log('   实际的customerInfo:', actualCustomerInfo);
    
    if (actualCustomerInfo.nickname === expectedCustomerInfo.nickname && 
        actualCustomerInfo.phone === expectedCustomerInfo.phone) {
      console.log('✅ customerInfo验证通过！使用了真实用户信息，忽略了前端传递的假信息');
    } else {
      console.log('❌ customerInfo验证失败！没有使用真实用户信息');
    }
    
    // 5. 查询用户的所有订单
    console.log('\n5. 查询用户的所有订单...');
    const ordersResponse = await axios.get(`${API_BASE_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!ordersResponse.data.success) {
      console.log('❌ 查询订单列表失败:', ordersResponse.data.message);
      return;
    }
    
    const orders = ordersResponse.data.data.orders;
    console.log('✅ 订单列表查询成功');
    console.log(`   共找到 ${orders.length} 个订单`);
    
    // 检查所有订单的customerInfo是否一致
    let allConsistent = true;
    for (const order of orders) {
      if (order.customerInfo.nickname !== userInfo.nickname || 
          order.customerInfo.phone !== userInfo.phone) {
        allConsistent = false;
        console.log(`   ⚠️  订单 ${order.orderNumber} 的customerInfo不一致:`, order.customerInfo);
      }
    }
    
    if (allConsistent) {
      console.log('✅ 所有订单的customerInfo都与用户信息一致');
    } else {
      console.log('❌ 部分订单的customerInfo与用户信息不一致');
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:');
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   错误信息:', error.response.data.message || error.response.data);
      if (error.response.data.errors) {
        console.error('   详细错误:', JSON.stringify(error.response.data.errors, null, 2));
      }
    } else {
      console.error('   错误信息:', error.message);
    }
  }
}

// 运行测试
testOrderCreation();