import axios from 'axios';

// 测试订单API
const testOrdersAPI = async () => {
  try {
    console.log('=== 测试订单API ===\n');
    
    // 用户token（从之前的测试中获取）
    const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODllYThiZTJmNTk2NDRlYTBkY2MzMWEiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUyNDU5NjksImV4cCI6MTc1NTI1MzE2OX0.I7MKVlD8WkdELFur86B0uVjYZ9UQ9kHDG41EuqGNtCA';
    
    console.log('1. 测试GET /api/v1/orders（获取用户订单列表）...');
    
    const response = await axios.get('http://localhost:3000/api/v1/orders', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 请求成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const { orders, pagination } = response.data.data;
      console.log(`\n📊 订单统计:`);
      console.log(`   总订单数: ${pagination.total}`);
      console.log(`   当前页: ${pagination.current}`);
      console.log(`   每页数量: ${pagination.pageSize}`);
      console.log(`   总页数: ${pagination.pages}`);
      
      if (orders && orders.length > 0) {
        console.log(`\n📋 订单列表 (显示前5个):`);
        orders.slice(0, 5).forEach((order, index) => {
          console.log(`   ${index + 1}. 订单号: ${order.orderNumber}`);
          console.log(`      状态: ${order.status}`);
          console.log(`      金额: ¥${order.totalAmount}`);
          console.log(`      就餐方式: ${order.dineType}`);
          console.log(`      商品数量: ${order.items?.length || 0}`);
          console.log(`      创建时间: ${order.createdAt}`);
          console.log(`      ---`);
        });
        
        // 按状态统计
        const statusStats = {};
        orders.forEach(order => {
          statusStats[order.status] = (statusStats[order.status] || 0) + 1;
        });
        
        console.log(`\n📈 状态统计:`);
        Object.entries(statusStats).forEach(([status, count]) => {
          console.log(`   ${status}: ${count} 个`);
        });
      } else {
        console.log('❌ 订单列表为空');
      }
    } else {
      console.log('❌ 响应格式异常:', response.data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:');
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   错误信息:', error.response.data?.message || error.response.data);
    } else {
      console.error('   错误:', error.message);
    }
  }
};

// 运行测试
testOrdersAPI();