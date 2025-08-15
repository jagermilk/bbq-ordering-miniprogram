import mongoose from 'mongoose';
import User from './api/models/User.js';
import Order from './api/models/Order.js';
import Merchant from './api/models/Merchant.js';
import connectDB from './api/config/database.js';

// 修复客户数据映射问题
const fixCustomerDataMapping = async () => {
  try {
    await connectDB();
    console.log('🔧 开始修复客户数据映射问题...');
    
    // 1. 检查当前订单数据结构
    console.log('\n=== 检查订单数据结构 ===');
    const sampleOrder = await Order.findOne({})
      .populate('customerId', 'nickname avatar phone')
      .populate('merchantId', 'name');
    
    if (sampleOrder) {
      console.log('样本订单数据结构:');
      console.log('- customerId (populate):', sampleOrder.customerId);
      console.log('- customerInfo:', sampleOrder.customerInfo);
      console.log('- 前端期望的字段: customerName, customerPhone');
    }
    
    // 2. 分析问题
    console.log('\n=== 问题分析 ===');
    console.log('问题：前端期望 customerName 和 customerPhone 字段');
    console.log('现状：后端返回 customerId (populate) 和 customerInfo 对象');
    console.log('解决方案：在后端API中添加虚拟字段映射');
    
    // 3. 检查所有订单的客户信息来源
    console.log('\n=== 订单客户信息来源分析 ===');
    const orders = await Order.find({})
      .populate('customerId', 'nickname phone')
      .select('orderNumber customerId customerInfo')
      .limit(10);
    
    console.log('前10个订单的客户信息来源:');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. 订单号: ${order.orderNumber}`);
      
      let customerName = '未知';
      let customerPhone = '未知';
      let dataSource = '';
      
      if (order.customerId) {
        customerName = order.customerId.nickname || '未设置';
        customerPhone = order.customerId.phone || '未设置';
        dataSource = 'User表 (populate)';
      } else if (order.customerInfo && order.customerInfo.nickname) {
        customerName = order.customerInfo.nickname;
        customerPhone = order.customerInfo.phone || '未设置';
        dataSource = 'customerInfo字段';
      }
      
      console.log(`   客户姓名: ${customerName}`);
      console.log(`   客户电话: ${customerPhone}`);
      console.log(`   数据来源: ${dataSource}`);
      console.log('   ---');
    });
    
    // 4. 提供解决方案建议
    console.log('\n=== 解决方案建议 ===');
    console.log('方案1: 修改后端API，添加customerName和customerPhone虚拟字段');
    console.log('方案2: 修改前端代码，使用正确的字段名');
    console.log('方案3: 在API响应中进行数据转换');
    
    console.log('\n推荐使用方案1，在Order模型中添加虚拟字段:');
    console.log(`
// 在Order模型中添加虚拟字段
orderSchema.virtual('customerName').get(function() {
  if (this.customerId && this.customerId.nickname) {
    return this.customerId.nickname;
  }
  if (this.customerInfo && this.customerInfo.nickname) {
    return this.customerInfo.nickname;
  }
  return '顾客';
});

orderSchema.virtual('customerPhone').get(function() {
  if (this.customerId && this.customerId.phone) {
    return this.customerId.phone;
  }
  if (this.customerInfo && this.customerInfo.phone) {
    return this.customerInfo.phone;
  }
  return null;
});

orderSchema.virtual('diningType').get(function() {
  return this.dineType === 'dine-in' ? 'dine_in' : this.dineType;
});`);
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 数据库连接已关闭');
  }
};

fixCustomerDataMapping();