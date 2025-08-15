import mongoose from 'mongoose';
import User from './api/models/User.js';
import Order from './api/models/Order.js';
import Merchant from './api/models/Merchant.js';
import connectDB from './api/config/database.js';

// 检查所有用户数据，寻找可能的重复或相似用户
const checkAllUsers = async () => {
  try {
    await connectDB();
    console.log('🔍 检查所有用户数据...');
    
    // 1. 查找所有用户
    console.log('\n=== 所有用户列表 ===');
    const allUsers = await User.find({})
      .select('_id username nickname phone email isActive createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`数据库中共有 ${allUsers.length} 个用户:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   昵称: ${user.nickname}`);
      console.log(`   手机: ${user.phone || '未设置'}`);
      console.log(`   邮箱: ${user.email || '未设置'}`);
      console.log(`   状态: ${user.isActive ? '激活' : '未激活'}`);
      console.log(`   创建时间: ${user.createdAt}`);
      console.log('---');
    });
    
    // 2. 检查是否有相似的用户名或昵称
    console.log('\n=== 相似用户检查 ===');
    const similarUsers = allUsers.filter(user => 
      user.username?.toLowerCase().includes('test') || 
      user.nickname?.includes('测试') ||
      user.nickname?.toLowerCase().includes('test')
    );
    
    console.log(`找到 ${similarUsers.length} 个包含'test'或'测试'的用户:`);
    similarUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.nickname}) - ID: ${user._id}`);
    });
    
    // 3. 检查所有订单的客户信息
    console.log('\n=== 订单客户信息检查 ===');
    const ordersWithCustomerInfo = await Order.find({})
      .select('_id orderNumber customerId customerInfo createdAt')
      .sort({ createdAt: -1 })
      .limit(20); // 只检查最近20个订单
    
    console.log('最近20个订单的客户信息:');
    for (const order of ordersWithCustomerInfo) {
      console.log(`订单号: ${order.orderNumber}`);
      console.log(`  customerId: ${order.customerId || 'null'}`);
      console.log(`  customerInfo: ${JSON.stringify(order.customerInfo)}`);
      
      // 如果有customerId，查找对应用户
      if (order.customerId) {
        const user = await User.findById(order.customerId).select('username nickname');
        if (user) {
          console.log(`  对应用户: ${user.username} (${user.nickname})`);
        } else {
          console.log(`  ⚠️ 用户不存在`);
        }
      }
      console.log('---');
    }
    
    // 4. 检查是否有孤儿订单（customerId指向不存在的用户）
    console.log('\n=== 孤儿订单检查 ===');
    const allOrders = await Order.find({ customerId: { $ne: null } }).select('_id orderNumber customerId');
    const orphanOrders = [];
    
    for (const order of allOrders) {
      const user = await User.findById(order.customerId);
      if (!user) {
        orphanOrders.push(order);
      }
    }
    
    if (orphanOrders.length > 0) {
      console.log(`⚠️ 发现 ${orphanOrders.length} 个孤儿订单:`);
      orphanOrders.forEach(order => {
        console.log(`  订单号: ${order.orderNumber}, customerId: ${order.customerId}`);
      });
    } else {
      console.log('✅ 没有发现孤儿订单');
    }
    
    // 5. 检查用户名重复
    console.log('\n=== 用户名重复检查 ===');
    const usernames = allUsers.map(u => u.username).filter(Boolean);
    const duplicateUsernames = usernames.filter((item, index) => usernames.indexOf(item) !== index);
    
    if (duplicateUsernames.length > 0) {
      console.log(`⚠️ 发现重复用户名: ${duplicateUsernames.join(', ')}`);
    } else {
      console.log('✅ 没有发现重复用户名');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 数据库连接已关闭');
  }
};

checkAllUsers();