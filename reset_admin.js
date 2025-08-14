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

// 重置admin用户
const resetAdmin = async () => {
  try {
    console.log('🔄 开始重置admin用户...');
    
    // 连接数据库
    await connectDB();
    
    // 删除现有的admin用户
    const deleteResult = await Merchant.deleteOne({ username: 'admin' });
    console.log('🗑️  删除现有admin用户:', deleteResult.deletedCount > 0 ? '成功' : '未找到');
    
    // 创建新的admin用户
    const newAdmin = new Merchant({
      username: 'admin',
      password: '123456',
      name: '烧烤摊示例店',
      description: '正宗烧烤，美味可口，欢迎品尝！',
      phone: '13800138000',
      address: '某某街道某某号烧烤一条街',
      isActive: true
    });
    
    await newAdmin.save();
    console.log('✅ 新admin用户创建成功');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    console.log('   商户ID:', newAdmin._id.toString());
    
    // 验证新密码
    const testPassword = '123456';
    const isValid = await newAdmin.comparePassword(testPassword);
    console.log('🔐 密码验证:', isValid ? '✅ 成功' : '❌ 失败');
    
  } catch (error) {
    console.error('❌ 重置失败:', error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n📡 数据库连接已关闭');
    process.exit(0);
  }
};

// 运行重置脚本
resetAdmin();