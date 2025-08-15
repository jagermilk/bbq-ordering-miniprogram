// 使用Node.js内置的fetch API (Node.js 18+)

// 测试创建菜品
async function testCreateProduct() {
  try {
    const response = await fetch('http://localhost:3000/api/v1/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NzZhNzE5ZjY5YzNhNzI4ZjE4ZGI5YSIsInJvbGUiOiJtZXJjaGFudCIsImlhdCI6MTczNTg4NzY0MSwiZXhwIjoxNzM2NDkyNDQxfQ.Ey_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
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
    console.log('响应状态:', response.status);
    console.log('响应结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ 菜品创建成功!');
    } else {
      console.log('❌ 菜品创建失败:', result.message);
      if (result.errors) {
        console.log('错误详情:', result.errors);
      }
    }
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testCreateProduct();