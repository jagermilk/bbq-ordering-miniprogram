/**
 * 数据转换工具函数
 * 用于将MongoDB的_id字段转换为前端期望的id字段
 */

/**
 * 转换单个对象，将_id字段重命名为id
 * @param {Object} obj - 要转换的对象
 * @returns {Object} 转换后的对象
 */
export const transformId = (obj) => {
  if (!obj) return obj;
  
  // 如果是Mongoose文档，先转换为普通对象
  const plainObj = obj.toObject ? obj.toObject() : obj;
  
  // 创建新对象，避免修改原对象
  const transformed = { ...plainObj };
  
  // 将_id重命名为id，并确保转换为字符串
  if (transformed._id) {
    transformed.id = transformed._id.toString();
    delete transformed._id;
  }
  
  // 递归处理嵌套对象
  Object.keys(transformed).forEach(key => {
    if (transformed[key] && typeof transformed[key] === 'object') {
      if (Array.isArray(transformed[key])) {
        // 处理数组
        transformed[key] = transformed[key].map(item => 
          typeof item === 'object' && item !== null ? transformId(item) : item
        );
      } else if (transformed[key]._id) {
        // 处理嵌套对象
        transformed[key] = transformId(transformed[key]);
      }
    }
  });
  
  return transformed;
};

/**
 * 转换对象数组，将每个对象的_id字段重命名为id
 * @param {Array} arr - 要转换的对象数组
 * @returns {Array} 转换后的数组
 */
export const transformIdArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => transformId(item));
};

/**
 * 转换分页数据格式
 * @param {Object} data - 包含数据和分页信息的对象
 * @param {string} dataKey - 数据字段名（如'orders', 'products'等）
 * @returns {Object} 转换后的分页数据
 */
export const transformPaginatedData = (data, dataKey) => {
  if (!data || !data[dataKey]) return data;
  
  return {
    ...data,
    [dataKey]: transformIdArray(data[dataKey])
  };
};

/**
 * 转换API响应数据格式
 * @param {Object} response - API响应对象
 * @param {string|Array} dataKeys - 需要转换的数据字段名
 * @returns {Object} 转换后的响应对象
 */
export const transformApiResponse = (response, dataKeys) => {
  if (!response || !response.data) return response;
  
  const keys = Array.isArray(dataKeys) ? dataKeys : [dataKeys];
  const transformedData = { ...response.data };
  
  keys.forEach(key => {
    if (transformedData[key]) {
      if (Array.isArray(transformedData[key])) {
        transformedData[key] = transformIdArray(transformedData[key]);
      } else {
        transformedData[key] = transformId(transformedData[key]);
      }
    }
  });
  
  return {
    ...response,
    data: transformedData
  };
};

export default {
  transformId,
  transformIdArray,
  transformPaginatedData,
  transformApiResponse
};