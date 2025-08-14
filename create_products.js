import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './api/models/Product.js';

// 加载环境变量
dotenv.config({ path: '.env.development' });

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

// 创建示例菜品
const createProducts = async () => {
  try {
    console.log('🍖 开始创建示例菜品...');
    
    // 连接数据库
    await connectDB();
    
    const merchantId = '689d9957e4f9a5cf7a934399';
    
    // 删除旧的菜品数据
    const deleteResult = await Product.deleteMany({ merchantId });
    console.log('🗑️  删除旧菜品数据:', deleteResult.deletedCount, '条');
    
    const sampleProducts = [
      {
        merchantId,
        name: '烤羊肉串',
        price: 3.00,
        description: '新鲜羊肉，香嫩可口，秘制调料腌制',
        category: '烤串类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤鸡翅',
        price: 8.00,
        description: '秘制烤鸡翅，外焦里嫩，香气扑鼻',
        category: '烤串类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤牛肉串',
        price: 5.00,
        description: '优质牛肉，口感鲜美，营养丰富',
        category: '烤串类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤韭菜',
        price: 2.00,
        description: '新鲜韭菜，清香爽口，解腥去腻',
        category: '蔬菜类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤茄子',
        price: 6.00,
        description: '软糯茄子，蒜蓉调味，香味浓郁',
        category: '蔬菜类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤玉米',
        price: 4.00,
        description: '甜嫩玉米，黄油香味，老少皆宜',
        category: '蔬菜类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤鱿鱼',
        price: 12.00,
        description: '新鲜鱿鱼，Q弹爽口，海鲜美味',
        category: '海鲜类',
        isAvailable: true
      },
      {
        merchantId,
        name: '烤扇贝',
        price: 15.00,
        description: '肥美扇贝，蒜蓉粉丝，鲜美无比',
        category: '海鲜类',
        isAvailable: true
      },
      {
        merchantId,
        name: '冰镇啤酒',
        price: 8.00,
        description: '冰爽啤酒，解腻消暑，烧烤必备',
        category: '饮品类',
        isAvailable: true
      },
      {
        merchantId,
        name: '鲜榨果汁',
        price: 10.00,
        description: '新鲜水果现榨，维C丰富，健康美味',
        category: '饮品类',
        isAvailable: true
      }
    ];
    
    await Product.insertMany(sampleProducts);
    console.log(`✅ 创建了 ${sampleProducts.length} 个示例菜品`);
    console.log('📋 商户ID:', merchantId);
    
  } catch (error) {
    console.error('❌ 创建菜品失败:', error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n📡 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行脚本
createProducts();