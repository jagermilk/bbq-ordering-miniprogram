import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Merchant from './api/models/Merchant.js';

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

// 调试商户数据
const debugMerchant = async () => {
  try {
    console.log('🔍 开始调试商户数据...');
    
    // 连接数据库
    await connectDB();
    
    // 查找admin商户
    const merchant = await Merchant.findOne({ username: 'admin' }).select('+password');
    
    if (!merchant) {
      console.log('❌ 未找到admin商户');
      return;
    }
    
    console.log('✅ 找到admin商户:');
    console.log('   ID:', merchant._id.toString());
    console.log('   用户名:', merchant.username);
    console.log('   密码哈希:', merchant.password);
    console.log('   状态:', merchant.isActive);
    
    // 测试密码验证
    const testPassword = '123456';
    console.log('\n🔐 测试密码验证:');
    console.log('   测试密码:', testPassword);
    
    try {
      const isValid = await merchant.comparePassword(testPassword);
      console.log('   验证结果:', isValid ? '✅ 密码正确' : '❌ 密码错误');
      
      // 手动验证
      const manualCheck = await bcrypt.compare(testPassword, merchant.password);
      console.log('   手动验证:', manualCheck ? '✅ 密码正确' : '❌ 密码错误');
      
    } catch (error) {
      console.error('   验证错误:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n📡 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行调试脚本
debugMerchant();