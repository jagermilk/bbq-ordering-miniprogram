import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Merchant from './api/models/Merchant.js';

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

// 修复admin用户状态
const fixAdminStatus = async () => {
  try {
    console.log('🔧 开始修复admin用户状态...');
    
    // 连接数据库
    await connectDB();
    
    // 查找admin用户
    const adminUser = await Merchant.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ 未找到admin用户');
      return;
    }
    
    console.log('📋 当前admin用户状态:');
    console.log('   用户名:', adminUser.username);
    console.log('   激活状态:', adminUser.isActive);
    console.log('   用户ID:', adminUser._id.toString());
    
    // 如果用户已经是激活状态，则无需修改
    if (adminUser.isActive) {
      console.log('✅ admin用户已经是激活状态，无需修改');
      return;
    }
    
    // 更新用户状态为激活
    await Merchant.updateOne(
      { username: 'admin' },
      { $set: { isActive: true } }
    );
    
    console.log('✅ admin用户状态已修复为激活状态');
    
    // 验证修改结果
    const updatedUser = await Merchant.findOne({ username: 'admin' });
    console.log('📋 修复后的用户状态:');
    console.log('   用户名:', updatedUser.username);
    console.log('   激活状态:', updatedUser.isActive);
    
  } catch (error) {
    console.error('❌ 修复admin用户状态失败:', error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('📡 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行修复脚本
fixAdminStatus();