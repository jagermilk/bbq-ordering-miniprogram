import mongoose from 'mongoose';
import User from './api/models/User.js';
import Order from './api/models/Order.js';
import Merchant from './api/models/Merchant.js';
import connectDB from './api/config/database.js';

// 检查testuser相关的用户数据
const checkTestuserData = async () => {
  try {
    await connectDB();
    console.log('🔍 检查testuser相关用户数据...');
    
    // 1. 查找所有可能相关的用户
    console.log('\n=== 查找相关用户 ===');
    const users = await User.find({
      $or: [
        { username: /test/i },
        { nickname: /测试/i },
        { nickname: /test/i }
      ]
    }).select('_id username nickname phone email isActive createdAt');
    
    console.log(`找到 ${users.length} 个相关用户:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   昵称: ${user.nickname}`);
      console.log(`   手机: ${user.phone || '未设置'}`);
      console.log(`   邮箱: ${user.email || '未设置'}`);
      console.log(`   状态: ${user.isActive ? '激活' : '未激活'}`);
      console.log(`   创建时间: ${user.createdAt}`);
      console.log('---');
    });
    
    // 2. 特别检查testuser用户
    console.log('\n=== testuser用户详情 ===');
    const testuser = await User.findOne({ username: 'testuser' });
    if (testuser) {
      console.log('✅ testuser用户存在:');
      console.log(`   ID: ${testuser._id}`);
      console.log(`   用户名: ${testuser.username}`);
      console.log(`   昵称: ${testuser.nickname}`);
      console.log(`   手机: ${testuser.phone || '未设置'}`);
      console.log(`   状态: ${testuser.isActive ? '激活' : '未激活'}`);
      
      // 3. 检查该用户的订单
      console.log('\n=== testuser的订单数据 ===');
      const orders = await Order.find({ customerId: testuser._id })
        .populate('merchantId', 'name')
        .select('_id orderNumber status totalAmount dineType createdAt customerInfo')
        .sort({ createdAt: -1 });
      
      console.log(`testuser (${testuser._id}) 的订单数量: ${orders.length}`);
      orders.forEach((order, index) => {
        console.log(`${index + 1}. 订单号: ${order.orderNumber}`);
        console.log(`   状态: ${order.status}`);
        console.log(`   金额: ¥${order.totalAmount}`);
        console.log(`   就餐方式: ${order.dineType}`);
        console.log(`   商户: ${order.merchantId?.name || '未知'}`);
        console.log(`   客户信息: ${JSON.stringify(order.customerInfo)}`);
        console.log(`   创建时间: ${order.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('❌ testuser用户不存在');
    }
    
    // 4. 检查所有订单的customerId分布
    console.log('\n=== 订单customerId分布 ===');
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$customerId',
          count: { $sum: 1 },
          orderNumbers: { $push: '$orderNumber' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('订单按用户分布:');
    for (const stat of orderStats) {
      const user = stat.user[0];
      console.log(`用户ID: ${stat._id}`);
      console.log(`  用户名: ${user?.username || '未知'}`);
      console.log(`  昵称: ${user?.nickname || '未知'}`);
      console.log(`  订单数量: ${stat.count}`);
      console.log(`  订单号: ${stat.orderNumbers.join(', ')}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 数据库连接已关闭');
  }
};

checkTestuserData();