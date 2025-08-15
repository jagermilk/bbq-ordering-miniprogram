import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './api/models/User.js';
import connectDB from './api/config/database.js';

// 生成新的token
const generateToken = async () => {
  try {
    await connectDB();
    console.log('🔑 生成新的token...');
    
    // 查找testuser
    const user = await User.findOne({ username: 'testuser' });
    
    if (!user) {
      console.log('❌ 未找到testuser用户');
      return;
    }
    
    console.log('找到用户:', {
      id: user._id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    });
    
    // 生成token
    const JWT_SECRET = 'dev-super-secret-jwt-key-for-development';
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n✅ 新token生成成功:');
    console.log(token);
    
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n🔍 Token验证结果:');
    console.log(decoded);
    
  } catch (error) {
    console.error('❌ 生成token失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔚 数据库连接已关闭');
  }
};

generateToken();