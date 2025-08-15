import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Merchant from '../models/Merchant.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// 加载环境变量
dotenv.config();

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

// 创建默认商户
const createDefaultMerchant = async () => {
  try {
    // 检查是否已存在默认商户
    const existingMerchant = await Merchant.findOne({ username: 'admin' });
    if (existingMerchant) {
      console.log('⚠️  默认商户已存在，跳过创建');
      return existingMerchant;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash('123456', 12);

    // 创建默认商户
    const defaultMerchant = new Merchant({
      username: 'admin',
      password: hashedPassword,
      name: '烧烤摊示例店',
      description: '正宗烧烤，美味可口，欢迎品尝！',
      phone: '13800138000',
      address: '某某街道某某号烧烤一条街',
      isActive: true
    });

    await defaultMerchant.save();
    console.log('✅ 默认商户创建成功');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    
    return defaultMerchant;
  } catch (error) {
    console.error('❌ 创建默认商户失败:', error.message);
    throw error;
  }
};

// 创建默认用户
const createDefaultUser = async () => {
  try {
    // 检查是否已存在默认用户
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('⚠️  默认用户已存在，跳过创建');
      return existingUser;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash('test123456', 12);

    // 创建默认用户
    const defaultUser = new User({
      username: 'testuser',
      password: hashedPassword,
      nickname: '测试用户',
      role: 'customer',
      isActive: true
    });

    await defaultUser.save();
    console.log('✅ 默认用户创建成功');
    console.log('   用户名: testuser');
    console.log('   密码: test123456');
    
    return defaultUser;
  } catch (error) {
    console.error('❌ 创建默认用户失败:', error.message);
    throw error;
  }
};

// 创建示例菜品
const createSampleProducts = async (merchantId) => {
  try {
    // 检查是否已存在示例菜品
    const existingProducts = await Product.find({ merchantId });
    if (existingProducts.length > 0) {
      console.log('⚠️  示例菜品已存在，跳过创建');
      return;
    }

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
  } catch (error) {
    console.error('❌ 创建示例菜品失败:', error.message);
    throw error;
  }
};

// 主函数
const seedDatabase = async () => {
  try {
    console.log('🌱 开始初始化数据库...');
    
    // 连接数据库
    await connectDB();
    
    // 创建默认商户
    const merchant = await createDefaultMerchant();
    
    // 创建默认用户
    const user = await createDefaultUser();
    
    // 创建示例菜品
    await createSampleProducts(merchant._id);
    
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📋 初始化信息:');
    console.log('   商户用户名: admin');
    console.log('   商户密码: 123456');
    console.log('   商户ID:', merchant._id.toString());
    console.log('');
    console.log('   用户用户名: testuser');
    console.log('   用户密码: test123456');
    console.log('   用户ID:', user._id.toString());
    console.log('');
    console.log('🚀 现在可以启动服务器了:');
    console.log('   npm start');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('📡 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行种子脚本
seedDatabase();