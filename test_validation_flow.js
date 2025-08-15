import express from 'express';
import { body, validationResult } from 'express-validator';

// 模拟验证错误处理中间件
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('验证失败，错误信息:', errors.array());
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      errors: errors.array()
    });
  }
  console.log('验证通过，继续执行');
  next();
};

// 模拟控制器函数
const mockController = (req, res) => {
  console.log('控制器被执行了！这说明验证中间件没有正确阻止请求');
  res.json({ success: true, message: '数据已保存' });
};

// 创建测试应用
const app = express();
app.use(express.json());

// 设置测试路由
app.post('/test', 
  body('image')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const urlRegex = /^(https?:\/\/.*|blob:.*|\/uploads\/.*)$/i;
      return urlRegex.test(value);
    })
    .withMessage('图片URL格式不正确'),
  handleValidationErrors,
  mockController
);

// 启动测试服务器
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`测试服务器运行在端口 ${PORT}`);
  
  // 发送测试请求
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: '面包片',
          price: 2,
          image: 'blob:http://localhost:5173/3e5ff551-4b55-41dc-9d60-32dbd01ed22f'
        })
      });
      
      const result = await response.json();
      console.log('响应状态:', response.status);
      console.log('响应内容:', result);
      
      process.exit(0);
    } catch (error) {
      console.error('测试请求失败:', error);
      process.exit(1);
    }
  }, 1000);
});