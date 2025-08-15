import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

/**
 * 更新现有订单的customerInfo字段
 * 确保所有有customerId的订单的customerInfo都使用正确的用户信息
 */
async function updateOrderCustomerInfo() {
  try {
    console.log('=== 开始更新订单customerInfo字段 ===\n');
    
    // 连接数据库
    await connectDB();
    
    // 查找所有有customerId的订单
    const ordersWithCustomerId = await Order.find({
      customerId: { $exists: true, $ne: null }
    }).populate('customerId');
    
    console.log(`找到 ${ordersWithCustomerId.length} 个有用户ID的订单`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const order of ordersWithCustomerId) {
      try {
        // 获取用户信息
        const user = await User.findById(order.customerId);
        
        if (!user) {
          console.log(`⚠️  订单 ${order.orderNumber} 的用户ID ${order.customerId} 不存在`);
          errorCount++;
          continue;
        }
        
        // 准备正确的customerInfo
        const correctCustomerInfo = {
          nickname: user.nickname || '',
          phone: user.phone || '',
          avatar: user.avatar || ''
        };
        
        // 检查当前customerInfo是否正确
        const currentInfo = order.customerInfo || {};
        const needsUpdate = (
          currentInfo.nickname !== correctCustomerInfo.nickname ||
          currentInfo.phone !== correctCustomerInfo.phone ||
          currentInfo.avatar !== correctCustomerInfo.avatar
        );
        
        if (needsUpdate) {
          console.log(`🔄 更新订单 ${order.orderNumber}:`);
          console.log(`   用户ID: ${order.customerId}`);
          console.log(`   旧信息: ${JSON.stringify(currentInfo)}`);
          console.log(`   新信息: ${JSON.stringify(correctCustomerInfo)}`);
          
          // 更新订单
          await Order.findByIdAndUpdate(order._id, {
            customerInfo: correctCustomerInfo
          });
          
          updatedCount++;
        } else {
          console.log(`✅ 订单 ${order.orderNumber} 的customerInfo已经正确`);
        }
        
      } catch (error) {
        console.error(`❌ 处理订单 ${order.orderNumber} 时出错:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== 更新完成 ===');
    console.log(`✅ 成功更新: ${updatedCount} 个订单`);
    console.log(`❌ 处理失败: ${errorCount} 个订单`);
    console.log(`📊 总计处理: ${ordersWithCustomerId.length} 个订单`);
    
    // 验证更新结果
    console.log('\n=== 验证更新结果 ===');
    const verifyOrders = await Order.find({
      customerId: { $exists: true, $ne: null }
    }).limit(5);
    
    for (const order of verifyOrders) {
      const user = await User.findById(order.customerId);
      if (user) {
        console.log(`订单 ${order.orderNumber}:`);
        console.log(`  用户: ${user.nickname} (${user.phone})`);
        console.log(`  customerInfo: ${JSON.stringify(order.customerInfo)}`);
        console.log(`  匹配: ${order.customerInfo.nickname === user.nickname && order.customerInfo.phone === user.phone ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行脚本
updateOrderCustomerInfo();