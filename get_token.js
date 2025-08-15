// 获取新的JWT令牌
async function getToken() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/merchant/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });

    const result = await response.json();
    console.log('登录响应状态:', response.status);
    console.log('登录结果:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data && result.data.token) {
      console.log('✅ 登录成功!');
      console.log('新的JWT令牌:', result.data.token);
      return result.data.token;
    } else {
      console.log('❌ 登录失败:', result.message);
      return null;
    }
  } catch (error) {
    console.error('登录请求失败:', error.message);
    return null;
  }
}

// 测试创建菜品
async function testCreateProduct(token) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: '面包片',
        price: 2,
        category: '主食类',
        description: '',
        image: 'blob:http://localhost:5173/3e5ff551-4b55-41dc-9d60-32dbd01ed22f'
      })
    });

    const result = await response.json();
    console.log('\n创建菜品响应状态:', response.status);
    console.log('创建菜品结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ 菜品创建成功!');
    } else {
      console.log('❌ 菜品创建失败:', result.message);
      if (result.errors) {
        console.log('错误详情:', result.errors);
      }
    }
  } catch (error) {
    console.error('创建菜品请求失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🔐 正在获取新的JWT令牌...');
  const token = await getToken();
  
  if (token) {
    console.log('\n🍞 正在测试创建菜品...');
    await testCreateProduct(token);
  }
}

main();