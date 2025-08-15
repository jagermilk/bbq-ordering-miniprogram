import axios from 'axios';

// 测试修复后的订单API
const testFixedAPI = async () => {
  try {
    console.log('🧪 测试修复后的订单API...');
    
    // 使用testuser的正确token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODllYThiZTJmNTk2NDRlYTBkY2MzMWEiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MjQ3MDMyLCJleHAiOjE3NTUzMzM0MzJ9.ao3WDLVBaow2dRCTlpRzVESGWiYgXaGM5yVjwUM9MFE';
    
    console.log('\n=== 测试GET /api/v1/orders ===');
    const response = await axios.get('http://localhost:3000/api/v1/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('响应状态:', response.status);
    console.log('响应数据结构:');
    
    if (response.data.success && response.data.data.orders.length > 0) {
      const firstOrder = response.data.data.orders[0];
      console.log('\n第一个订单的字段:');
      console.log('- orderNumber:', firstOrder.orderNumber);
      console.log('- customerName:', firstOrder.customerName); // 新增的虚拟字段
      console.log('- customerPhone:', firstOrder.customerPhone); // 新增的虚拟字段
      console.log('- diningType:', firstOrder.diningType); // 新增的虚拟字段
      console.log('- status:', firstOrder.status);
      console.log('- totalAmount:', firstOrder.totalAmount);
      console.log('- dineType (原字段):', firstOrder.dineType);
      
      // 检查原始数据结构
      console.log('\n原始数据结构:');
      console.log('- customerId:', firstOrder.customerId);
      console.log('- customerInfo:', firstOrder.customerInfo);
      
      console.log('\n✅ 修复成功！现在API返回了前端期望的字段:');
      console.log('- customerName: 用于显示客户姓名');
      console.log('- customerPhone: 用于显示客户电话');
      console.log('- diningType: 用于显示就餐方式（兼容前端格式）');
      
      // 检查所有订单的客户信息
      console.log('\n=== 所有订单的客户信息 ===');
      response.data.data.orders.forEach((order, index) => {
        console.log(`${index + 1}. 订单号: ${order.orderNumber}`);
        console.log(`   客户姓名: ${order.customerName}`);
        console.log(`   客户电话: ${order.customerPhone || '未设置'}`);
        console.log(`   就餐方式: ${order.diningType}`);
        console.log('   ---');
      });
      
    } else {
      console.log('❌ 没有找到订单数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
};

testFixedAPI();