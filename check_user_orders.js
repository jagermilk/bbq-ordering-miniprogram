import mongoose from 'mongoose';
import User from './api/models/User.js';
import Order from './api/models/Order.js';
import Merchant from './api/models/Merchant.js';
import Product from './api/models/Product.js';
import connectDB from './api/config/database.js';

// 要检查的用户ID
const USER_ID = '689ea8be2f59644ea0dcc31a';

// 检查用户和订单数据
const checkUserAndOrders = async () => {
  try {
    console.log('🔍 连接数据库...');
    await connectDB();
    
    console.log(`\n📋 检查用户ID: ${USER_ID}`);
    
    // 1. 检查用户是否存在
    const user = await User.findById(USER_ID);
    if (user) {
      console.log('✅ 用户存在:');
      console.log(`   用户名: ${user.username}`);
      console.log(`   昵称: ${user.nickname || '未设置'}`);
      console.log(`   手机: ${user.phone || '未设置'}`);
      console.log(`   状态: ${user.isActive ? '激活' : '未激活'}`);
      console.log(`   创建时间: ${user.createdAt}`);
    } else {
      console.log('❌ 用户不存在');
      return;
    }
    
    // 2. 查询该用户的订单
    console.log('\n🛒 查询用户订单...');
    const orders = await Order.find({ customerId: USER_ID })
      .populate('merchantId', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`📊 订单统计: 共找到 ${orders.length} 个订单`);
    
    if (orders.length > 0) {
      console.log('\n📋 订单列表:');
      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. 订单号: ${order.orderNumber}`);
        console.log(`      状态: ${order.status}`);
        console.log(`      商户: ${order.merchantId?.name || '未知'}`);
        console.log(`      金额: ¥${order.totalAmount}`);
        console.log(`      创建时间: ${order.createdAt}`);
        console.log(`      商品数量: ${order.items.length}`);
        console.log('      ---');
      });
    } else {
      console.log('❌ 该用户没有任何订单数据');
      
      // 3. 如果没有订单，检查是否有可用的商户和商品来创建测试订单
      console.log('\n🏪 检查可用商户和商品...');
      const merchants = await Merchant.find({ isActive: true }).limit(3);
      console.log(`找到 ${merchants.length} 个活跃商户`);
      
      if (merchants.length > 0) {
        for (const merchant of merchants) {
          const products = await Product.find({ 
            merchantId: merchant._id, 
            isAvailable: true 
          }).limit(3);
          console.log(`   商户 "${merchant.name}": ${products.length} 个可用商品`);
        }
        
        console.log('\n🎯 准备创建测试订单数据...');
        await createTestOrders(USER_ID, merchants);
      } else {
        console.log('❌ 没有找到活跃的商户，无法创建测试订单');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 数据库连接已关闭');
  }
};

// 创建测试订单
const createTestOrders = async (userId, merchants) => {
  try {
    const testOrders = [];
    
    for (let i = 0; i < merchants.length && i < 3; i++) {
      const merchant = merchants[i];
      
      // 获取该商户的商品
      const products = await Product.find({ 
        merchantId: merchant._id, 
        isAvailable: true 
      }).limit(2);
      
      if (products.length === 0) continue;
      
      // 创建不同状态的订单
      const statuses = ['pending', 'confirmed', 'completed'];
      const status = statuses[i] || 'pending';
      
      // 生成排队号
      const queueNumber = await Order.generateQueueNumber(merchant._id);
      
      // 计算订单项和总金额
      const orderItems = products.map(product => ({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3个
        subtotal: product.price * (Math.floor(Math.random() * 3) + 1),
        image: product.image || '',
        note: ''
      }));
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      const testOrder = new Order({
        merchantId: merchant._id,
        customerId: userId,
        status: status,
        dineType: i % 2 === 0 ? 'dine-in' : 'takeaway',
        totalAmount: totalAmount,
        queueNumber: queueNumber,
        customerInfo: {
          nickname: 'testuser',
          phone: '13800138000',
          avatar: ''
        },
        items: orderItems,
        note: `测试订单 ${i + 1} - ${status}`,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // 不同的创建时间
      });
      
      await testOrder.save();
      testOrders.push(testOrder);
      
      console.log(`✅ 创建测试订单: ${testOrder.orderNumber} (${status})`);
    }
    
    console.log(`\n🎉 成功创建 ${testOrders.length} 个测试订单`);
    
    // 再次查询验证
    const verifyOrders = await Order.find({ customerId: userId });
    console.log(`\n✅ 验证结果: 用户现在有 ${verifyOrders.length} 个订单`);
    
  } catch (error) {
    console.error('❌ 创建测试订单失败:', error);
  }
};

// 运行检查
checkUserAndOrders();