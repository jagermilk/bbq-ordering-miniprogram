import mongoose from 'mongoose';
import User from './api/models/User.js';
import Order from './api/models/Order.js';
import Merchant from './api/models/Merchant.js';
import Product from './api/models/Product.js';
import connectDB from './api/config/database.js';

// 要创建订单的用户ID
const USER_ID = '689ea8be2f59644ea0dcc31a';

// 创建多个测试订单
const createMoreTestOrders = async () => {
  try {
    console.log('🔍 连接数据库...');
    await connectDB();
    
    console.log(`\n🎯 为用户 ${USER_ID} 创建更多测试订单...`);
    
    // 获取用户信息
    const user = await User.findById(USER_ID);
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }
    
    // 获取活跃商户和商品
    const merchants = await Merchant.find({ isActive: true });
    if (merchants.length === 0) {
      console.log('❌ 没有找到活跃的商户');
      return;
    }
    
    const merchant = merchants[0]; // 使用第一个商户
    const products = await Product.find({ 
      merchantId: merchant._id, 
      isAvailable: true 
    }).limit(5);
    
    if (products.length === 0) {
      console.log('❌ 该商户没有可用商品');
      return;
    }
    
    console.log(`✅ 使用商户: ${merchant.name}`);
    console.log(`✅ 找到 ${products.length} 个可用商品`);
    
    // 定义不同状态的订单
    const orderConfigs = [
      {
        status: 'pending',
        dineType: 'dine-in',
        note: '测试待处理订单 - 堂食',
        daysAgo: 0
      },
      {
        status: 'confirmed',
        dineType: 'takeaway', 
        note: '测试已确认订单 - 外带',
        daysAgo: 1
      },
      {
        status: 'cooking',
        dineType: 'dine-in',
        note: '测试制作中订单 - 堂食',
        daysAgo: 1
      },
      {
        status: 'ready',
        dineType: 'takeaway',
        note: '测试已完成订单 - 外带',
        daysAgo: 2
      },
      {
        status: 'completed',
        dineType: 'dine-in',
        note: '测试已完成订单 - 堂食',
        daysAgo: 3
      },
      {
        status: 'cancelled',
        dineType: 'takeaway',
        note: '测试已取消订单 - 外带',
        daysAgo: 4
      }
    ];
    
    const createdOrders = [];
    
    for (let i = 0; i < orderConfigs.length; i++) {
      const config = orderConfigs[i];
      
      // 随机选择1-3个商品
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = products.slice(0, numItems);
      
      // 生成排队号
      const queueNumber = await Order.generateQueueNumber(merchant._id);
      
      // 创建订单项
      const orderItems = selectedProducts.map(product => {
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3个
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          subtotal: product.price * quantity,
          image: product.image || '',
          note: i === 0 ? '不要辣' : (i === 1 ? '多加辣椒' : '')
        };
      });
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // 计算创建时间（几天前）
      const createdAt = new Date(Date.now() - (config.daysAgo * 24 * 60 * 60 * 1000));
      
      const testOrder = new Order({
        merchantId: merchant._id,
        customerId: USER_ID,
        status: config.status,
        dineType: config.dineType,
        totalAmount: totalAmount,
        queueNumber: queueNumber,
        customerInfo: {
          nickname: user.nickname || 'testuser',
          phone: user.phone || '13800138000',
          avatar: user.avatar || ''
        },
        items: orderItems,
        note: config.note,
        createdAt: createdAt,
        updatedAt: createdAt
      });
      
      // 如果是已完成或已取消的订单，设置完成时间
      if (config.status === 'completed' || config.status === 'cancelled') {
        testOrder.completedAt = new Date(createdAt.getTime() + (2 * 60 * 60 * 1000)); // 2小时后完成
      }
      
      await testOrder.save();
      createdOrders.push(testOrder);
      
      console.log(`✅ 创建订单 ${i + 1}: ${testOrder.orderNumber} (${config.status}) - ¥${totalAmount}`);
    }
    
    console.log(`\n🎉 成功创建 ${createdOrders.length} 个测试订单`);
    
    // 验证结果
    const allOrders = await Order.find({ customerId: USER_ID }).sort({ createdAt: -1 });
    console.log(`\n✅ 验证结果: 用户现在总共有 ${allOrders.length} 个订单`);
    
    // 显示订单统计
    const statusStats = {};
    allOrders.forEach(order => {
      statusStats[order.status] = (statusStats[order.status] || 0) + 1;
    });
    
    console.log('\n📊 订单状态统计:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} 个`);
    });
    
  } catch (error) {
    console.error('❌ 创建测试订单失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 数据库连接已关闭');
  }
};

// 运行创建订单
createMoreTestOrders();