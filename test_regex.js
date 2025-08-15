// 测试正则表达式
const testUrl = 'blob:http://localhost:5173/3e5ff551-4b55-41dc-9d60-32dbd01ed22f';

// 当前使用的正则表达式
const urlRegex = /^(https?:\/\/.*|blob:.*|\/uploads\/.*)$/i;

console.log('测试URL:', testUrl);
console.log('正则表达式:', urlRegex);
console.log('测试结果:', urlRegex.test(testUrl));

// 测试其他URL格式
const testUrls = [
  'https://example.com/image.jpg',
  'http://example.com/image.png',
  'blob:http://localhost:5173/3e5ff551-4b55-41dc-9d60-32dbd01ed22f',
  '/uploads/image.jpg',
  'invalid-url'
];

console.log('\n测试多个URL:');
testUrls.forEach(url => {
  console.log(`${url} -> ${urlRegex.test(url)}`);
});