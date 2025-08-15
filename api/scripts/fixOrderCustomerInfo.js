import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 修复订单中customerInfo数据不一致的问题
 * 确保customerInfo与customerId对应的用户信息一致
 */
async function fixOrderCustomerInfo() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-ordering');
    console.log('数据库连接成功');
    
    // 查找所有有customerId的订单
    const orders = await Order.find({ customerId: { $ne: null } });
    console.log(`找到 ${orders.length} 个需要修复的订单`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      try {
        // 获取对应的用户信息
        const user = await User.findById(order.customerId);
        
        if (user) {
          // 更新customerInfo为用户的真实信息
          const updatedCustomerInfo = {
            nickname: user.nickname || '',
            phone: user.phone || '',
            avatar: user.avatar || ''
          };
          
          // 检查是否需要更新
          const needsUpdate = 
            order.customerInfo.nickname !== updatedCustomerInfo.nickname ||
            order.customerInfo.phone !== updatedCustomerInfo.phone ||
            order.customerInfo.avatar !== updatedCustomerInfo.avatar;
          
          if (needsUpdate) {
            await Order.findByIdAndUpdate(order._id, {
              customerInfo: updatedCustomerInfo
            });
            
            console.log(`订单 ${order._id} 的customerInfo已更新:`);
            console.log(`  旧信息: ${JSON.stringify(order.customerInfo)}`);
            console.log(`  新信息: ${JSON.stringify(updatedCustomerInfo)}`);
            updatedCount++;
          }
        } else {
          console.log(`警告: 订单 ${order._id} 的customerId ${order.customerId} 对应的用户不存在`);
        }
      } catch (error) {
        console.error(`处理订单 ${order._id} 时出错:`, error.message);
      }
    }
    
    console.log(`\n修复完成! 共更新了 ${updatedCount} 个订单的customerInfo`);
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}

// 运行修复脚本
fixOrderCustomerInfo();